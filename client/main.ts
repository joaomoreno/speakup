import { Event, Emitter } from './util';

class Microphone {

  private context: AudioContext;
  private analyser: AnalyserNode;

  private _stream: MediaStream;
  get stream(): MediaStream { return this._stream; }

  private _sourceNode: MediaStreamAudioSourceNode;
  get sourceNode(): MediaStreamAudioSourceNode { return this._sourceNode; }

  get frequencyBufferSize(): number { return this.analyser.frequencyBinCount; }

  private _onAudio = new Emitter<void>();
  get onAudio(): Event<void> { return this._onAudio.event; }

  private _onReady = new Emitter<void>();
  get onReady(): Event<void> { return this._onReady.event; }

  constructor() {
    this.context = new AudioContext();
    console.log(this.context.sampleRate);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;

    navigator.getUserMedia({ audio: true }, stream => this.setup(stream), err => console.error(err));
  }

  private setup(stream: MediaStream): void {
    this._stream = stream;
    this._sourceNode = this.context.createMediaStreamSource(stream);
    this._sourceNode.connect(this.analyser);
    this._onReady.fire();
  }

  getFloatFrequencyData(buffer: Float32Array): void {
    this.analyser.getFloatFrequencyData(buffer);
  }
}

const mic = new Microphone();
const bufferLength = mic.frequencyBufferSize;
const dataArray = new Float32Array(bufferLength);

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const canvasCtx = canvas.getContext('2d');

let canvasSize = { width: 0, height: 0 };
function updateCanvasSize() {
  canvasSize = canvas.getBoundingClientRect();
  canvas.width = canvasSize.width;
  canvas.height = canvasSize.height;
}

updateCanvasSize();
window.addEventListener('resize', updateCanvasSize);

function draw() {
  requestAnimationFrame(draw);

  mic.getFloatFrequencyData(dataArray);
  canvasCtx.fillStyle = 'rgb(255,255,255)';
  canvasCtx.fillRect(0, 0, canvasSize.width, canvasSize.height);

  canvasCtx.beginPath();
  canvasCtx.lineWidth = 5;
  canvasCtx.strokeStyle = 'rgba(128, 0, 0, 0.1)';

  const barWidth = (canvasSize.width / bufferLength) * 2.5;
  let x = 0;

  for (var i = 0; i < bufferLength; i++) {
    const barHeight = (dataArray[i] + 140) * 10;
    const y = canvasSize.height - barHeight / 2;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += barWidth + 1;
  }

  canvasCtx.stroke();
};

draw();

// var saveData = (function () {
//   var a = document.createElement("a");
//   document.body.appendChild(a);
//   a.style = "display: none";
//   return function (blob, fileName) {
//     let url = window.URL.createObjectURL(blob);
//     a.href = url;
//     a.download = fileName;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   };
// }());

// declare const WebAudioRecorder;
declare const RecordRTC;
declare const StereoAudioRecorder;

mic.onReady(() => {
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



})
