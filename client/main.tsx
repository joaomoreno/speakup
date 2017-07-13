import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from './util';
import { Microphone } from './audio';

interface Speaker {
  name: string;
  id: string;
}

interface SpeakerState {
  speaker: Speaker;
  time: number;
}

interface Model {
  [id: string]: SpeakerState;
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

type AppProps = {};

type AppState = {
  model: Model;
  subtitles: string,
  width: number,
  height: number
};

class App extends React.Component<AppProps, AppState> {

  private mic = new Microphone();

  constructor(props) {
    super(props);

    this.state = {
      model: {},
      subtitles: 'Hello There',
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

    this.mic.onReady(() => this.startRecording());
  }

  private startRecording() {
    const socket = new WebSocket('ws://localhost:8080/');
    const recorder = RecordRTC(this.mic.stream, {
      type: 'audio',
      recorderType: StereoAudioRecorder,
      numberOfAudioChannels: 1,
      desiredSampRate: 16 * 1000,
      disableLogs: true
    });

    recorder.startRecording();

    setInterval(() => {
      recorder.stopRecording(() => socket.send(recorder.getBlob()));
      recorder.startRecording();
    }, 5000);

    socket.addEventListener('message', e => {
      this.setState({
        ...this.state,
        model: JSON.parse(e.data)
      });
    });
  }

  render() {
    const speakerIds = Object.keys(this.state.model);
    const speakerStates = speakerIds.map(id => this.state.model[id]);

    return <div>
      <SpectrumAnalyzer width={this.state.width} height={this.state.height} microphone={this.mic} />
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
            <thead>
              <tr>
                <th>Name</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {
                speakerStates.map(s =>
                  <tr>
                    <th>{s.speaker.name}</th>
                    <td>{s.time}</td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </section>

      <Subtitles label={this.state.subtitles} />
    </div>;
  }
}

ReactDOM.render(<App />, document.body);

function record(mic: Microphone) {
  const socket = new WebSocket('ws://localhost:8080/');
  const recorder = RecordRTC(mic.stream, {
    type: 'audio',
    recorderType: StereoAudioRecorder,
    numberOfAudioChannels: 1,
    desiredSampRate: 16 * 1000,
    disableLogs: true
  });

  recorder.startRecording();

  setInterval(() => {
    recorder.stopRecording(() => socket.send(recorder.getBlob()));
    recorder.startRecording();
  }, 5000);

  socket.addEventListener('message', e => console.log(e.data));

  // recordRTC.startRecording();

  // setTimeout(() => {
  //   recordRTC.stopRecording(function (audioURL) {
  //     console.log(audioURL);

  //     // var blob = recordRTC.getBlob();
  //     // const url = window.URL.createObjectURL(blob);
  //     // window.location.assign(url);
  //     // // saveData(blob, 'hello.wav');
  //     // // recordRTC.getDataURL(function (dataURL) {
  //     // //   console.log(dataURL);
  //     // // });
  //   });
  // }, 1000);
}

// mic.onReady(() => recordOneSecond(mic));