import { Event, Emitter } from './util';
import { Microphone } from './audio';

const mic = new Microphone();
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

  const frequencyData = mic.getFloatFrequencyData();
  canvasCtx.fillStyle = 'rgb(255,240,240)';
  canvasCtx.fillRect(0, 0, canvasSize.width, canvasSize.height);

  canvasCtx.beginPath();

  // canvasCtx.lineWidth = 5;
  // canvasCtx.strokeStyle = 'rgba(128, 0, 0, 0.1)';
  canvasCtx.fillStyle = 'rgba(128, 0, 0, 0.05)';

  canvasCtx.moveTo(canvasSize.width, canvasSize.height);
  canvasCtx.lineTo(0, canvasSize.height);

  const barWidth = (canvasSize.width / frequencyData.length) * 2.5;
  let x = 0;

  for (var i = 0; i < frequencyData.length; i++) {
    const barHeight = (frequencyData[i] + 140) * 10;
    const y = canvasSize.height - barHeight / 2;

    canvasCtx.lineTo(x, y);
    x += barWidth + 1;
  }

  canvasCtx.lineTo(canvasSize.width, canvasSize.height);
  // canvasCtx.stroke();
  canvasCtx.fill();
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
  return;
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



})
