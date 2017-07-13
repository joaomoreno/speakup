import React from 'react';
import ReactDOM from 'react-dom';
import { Event, Emitter } from './util';
import { Microphone } from './audio';

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

    ctx.fillStyle = 'rgb(255,240,240)';
    ctx.fillRect(0, 0, this.props.width, this.props.height);

    ctx.beginPath();

    // ctx.lineWidth = 5;
    // ctx.strokeStyle = 'rgba(128, 0, 0, 0.1)';
    ctx.fillStyle = 'rgba(128, 0, 0, 0.05)';

    ctx.moveTo(this.props.width, this.props.height);
    ctx.lineTo(0, this.props.height);

    const barWidth = (this.props.width / frequencyData.length) * 2.5;
    let x = 0;

    for (var i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] + 140) * 10;
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

type AppProps = {
  microphone: Microphone
};

type AppState = {
  width: number,
  height: number
};

class App extends React.Component<AppProps, AppState> {

  constructor(props) {
    super(props);

    this.state = {
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
  }

  render() {
    return <SpectrumAnalyzer width={this.state.width} height={this.state.height} microphone={this.props.microphone} />;
  }
}

const mic = new Microphone();
ReactDOM.render(<App microphone={mic} />, document.body);

function recordOneSecond(mic: Microphone) {
  const socket = new WebSocket('ws://localhost:8080/');
  const recorder = RecordRTC(mic.stream, {
    type: 'audio',
    recorderType: StereoAudioRecorder,
    numberOfAudioChannels: 1,
    desiredSampRate: 16 * 1000
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