import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from './util';
import { Microphone } from './audio';
import { SpeechToTextService } from './speechService';

interface Speaker {
  name: string;
  id: string;
}

interface SpeakerState {
  speaker: Speaker;
  time: number;
}

interface Model {
  speakers: SpeakerState[];
  lastSpeakerId: string | undefined;
}

declare const RecordRTC;
declare const StereoAudioRecorder;

type SpectrumAnalyzerProps = {
  microphone: Microphone,
  width: number,
  height: number
};

class SpectrumAnalyzer extends React.Component<SpectrumAnalyzerProps> {

  private animationFrameRequest: number;

  componentDidMount() {
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    ctx.fillRect(0, 0, 100, 100);

    const draw = () => {
      this.animationFrameRequest = requestAnimationFrame(draw);
      this.paint();
    };

    draw();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animationFrameRequest);
  }

  paint() {
    const frequencyData = this.props.microphone.getFloatFrequencyData();
    const canvas = this.refs.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(250,250,250)';
    ctx.fillRect(0, 0, this.props.width, this.props.height);

    ctx.beginPath();

    // ctx.lineWidth = 5;
    // ctx.strokeStyle = 'rgba(128, 0, 0, 0.1)';
    ctx.fillStyle = 'rgb(240,240,240)';

    ctx.moveTo(this.props.width, this.props.height);
    ctx.lineTo(0, this.props.height);

    const barWidth = (this.props.width / frequencyData.length) * 2.5;
    let x = 0;

    for (var i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] + 140) * 7;
      const y = this.props.height - barHeight / 2;

      ctx.lineTo(x, y);
      x += barWidth + 1;
    }

    ctx.lineTo(this.props.width, this.props.height);
    // ctx.stroke();
    ctx.fill();
  }

  render() {
    return <canvas ref="canvas" width={this.props.width} height={this.props.height}></canvas>;
  }
}

function Subtitles(props: { label: string }) {
  return <footer className="footer">
    <div className="container">
      <div className="content has-text-centered">
        <p>{props.label}</p>
      </div>
    </div>
  </footer>;
}

type AppProps = {
  microphone: Microphone;
};

type AppState = {
  model: Model;
  subtitles: string,
  width: number,
  height: number
};

class App extends React.Component<AppProps, AppState> {

  constructor(props) {
    super(props);

    this.state = {
      model: { speakers: [], lastSpeakerId: undefined },
      subtitles: '',
      width: 0,
      height: 0
    };
  }

  componentDidMount() {
    const updateState = () => {
      const { width, height } = document.body.getBoundingClientRect();
      this.setState({ width, height });
    };

    window.addEventListener('resize', updateState);
    updateState();

    fetch('/devenv.json')
      .then(response => response.json())
      .then(({ bsKey }) => {
        const speechService = new SpeechToTextService(bsKey);
        speechService.start();
        speechService.onText(text => {
          this.setState({ ...this.state, subtitles: text });
        });

        this.startRecording(speechService.onSpeechPaused);
      });
  }

  private startRecording(onSpeechEnded: Event<void>) {
    const socket = new WebSocket('ws://localhost:8080/');
    const recorder = RecordRTC(this.props.microphone.stream, {
      type: 'audio',
      recorderType: StereoAudioRecorder,
      numberOfAudioChannels: 1,
      desiredSampRate: 16 * 1000,
      disableLogs: true
    });

    let startTime = new Date().getTime();
    recorder.startRecording();

    onSpeechEnded(() => {
      const duration = new Date().getTime() - startTime;

      recorder.stopRecording(() => {
        socket.send(String(duration));
        socket.send(recorder.getBlob());
      });

      startTime = new Date().getTime();
      recorder.startRecording();
    });

    socket.addEventListener('message', e => {
      this.setState({
        ...this.state,
        model: JSON.parse(e.data)
      });
    });
  }

  render() {
    const speakerStates = this.state.model.speakers;

    return <div>
      <SpectrumAnalyzer width={this.state.width} height={this.state.height} microphone={this.props.microphone} />
      <section className="hero is-primary">
        <div className="hero-body">
          <div className="container">
            <h1 className="title">
              Speakup!
            </h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <table className="table">
            <colgroup>
              <col span={1} style={{ width: '35%' }} />
              <col span={1} style={{ width: '50%' }} />
              <col span={1} style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Name</th>
                <th>Progress</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {
                speakerStates.map(s => {
                  const seconds = Math.round(s.time / 1000);

                  return <tr className={s.speaker.id === this.state.model.lastSpeakerId ? "is-selected" : ""}>
                    <th>{s.speaker.name}</th>
                    <td>
                      <progress className="progress is-info" value={Math.min(seconds / 60 * 100, 100)} max="100"></progress>
                    </td>
                    <td>
                      {seconds} s
                    </td>
                  </tr>
                })
              }
            </tbody>
          </table>
        </div>
      </section>

      <Subtitles label={this.state.subtitles} />
    </div>;
  }
}

const mic = new Microphone();
mic.onReady(() => ReactDOM.render(<App microphone={mic} />, document.body));
