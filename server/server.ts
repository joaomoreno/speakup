import * as express from 'express';
import * as ws from 'express-ws';
import { identifySpeaker } from "./lib/speaker-recognition";
// Test code
// import * as fs from 'fs';
// import * as WebSocket from 'ws';

interface Speaker {
  name: string;
  id: string;
}

interface SpeakerState {
  speaker: Speaker;
  time: number;
}

interface State {
  [id: string]: SpeakerState;
}

function createInitialState(speakers: Speaker[]): State {
  return speakers.reduce<State>((r, s) => ({ [s.id]: { speaker: s, time: 0 }, ...r }), {});
}

const speakers = require('../people.json') as Speaker[];
const state = createInitialState(speakers);

const app = express();
ws(app);

app.use(express.static(__dirname + '/..'));

app.ws('/', (ws, req) => {
  ws.on('message', async msg => {

    try {
      const speakerIds = speakers.map(s => s.id);
      const speakerId = await identifySpeaker(msg, speakerIds);
      const speakerState = state[speakerId];

      if (speakerState) {
        speakerState.time += 5;
      }

      ws.send(JSON.stringify(state));
    } catch (e) {
      console.error(e);
    }
  });
});

app.listen(8080, () => {
  console.log('Web server running in http://localhost:8080');
});

// Test code
// const wsx = new WebSocket('ws://localhost:8080');
// const audioCut = fs.readFileSync('C:/Users/t-mikapo/Documents/Projects/Standup/audio_cuts/michel_16khz.wav');
// let i = 0;
// wsx.on('open', function open() {
//   if (i == 0) {
//     wsx.send(audioCut);
//   }
//   i++;
// });
