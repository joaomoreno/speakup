function onAudio(stream: MediaStream) {
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  const mic = audioCtx.createMediaStreamSource(stream);
  mic.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
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

    analyser.getFloatFrequencyData(dataArray);
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
}

navigator.getUserMedia({ audio: true }, onAudio, err => console.error(err));

