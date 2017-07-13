import * as express from 'express';
import * as ws from 'express-ws';
import { identifySpeaker } from "./lib/speaker-recognition";
// Test code
// import * as fs from 'fs';
// import * as WebSocket from 'ws';

const app = express();
ws(app);

const state = {
  "Michel": 0,
  "Joao": 0
}; // stored in seconds

const speakers = {
  "2498991d-c5a9-4143-a345-4b8ba23605ea": "Michel",
  "1204fa35-12b0-466c-a42f-6d1d53358f6c": "Joao"
}

app.use(express.static(__dirname + '/..'));

app.ws('/', (ws, req) => {
  ws.on('message', async msg => {
    try {
      console.log(Object.keys(speakers));
      const speakerId = await identifySpeaker(msg, Object.keys(speakers));
      state[speakers[speakerId]] += 5;
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
