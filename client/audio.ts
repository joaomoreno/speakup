import { Event, Emitter } from './util';

export class Microphone {

  private context: AudioContext;
  private analyser: AnalyserNode;
  private sourceNode: MediaStreamAudioSourceNode;

  private _stream: MediaStream;
  get stream(): MediaStream { return this._stream; }

  private _onReady = new Emitter<void>();
  get onReady(): Event<void> { return this._onReady.event; }

  private _frequencyBuffer: Float32Array;

  constructor() {
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this._frequencyBuffer = new Float32Array(this.analyser.frequencyBinCount);

    navigator.getUserMedia({ audio: true }, stream => this.setup(stream), err => console.error(err));
  }

  private setup(stream: MediaStream): void {
    this._stream = stream;
    this.sourceNode = this.context.createMediaStreamSource(stream);
    this.sourceNode.connect(this.analyser);
    this._onReady.fire();
  }

  getFloatFrequencyData(): Float32Array {
    this.analyser.getFloatFrequencyData(this._frequencyBuffer);
    return this._frequencyBuffer;
  }
}
