import * as express from 'express';
import * as ws from 'express-ws';
import { identifySpeaker } from "./lib/speaker-recognition";

interface Speaker {
  name: string;
  id: string;
}

interface SpeakerState {
  speaker: Speaker;
  time: number;
  keyphrases: string[];
}

interface State {
  speakers: SpeakerState[];
  lastSpeakerId: string | undefined;
}

export const unknownId = '00000000-0000-0000-0000-000000000000';

function createInitialState(speakers: Speaker[]): State {
  return {
    speakers: [
      ...speakers.map(speaker => ({ speaker, time: 0, keyphrases: [] })),
      { speaker: { id: unknownId, name: 'John Doe' }, time: 0, keyphrases: [] }
    ],
    lastSpeakerId: undefined
  };
}

const speakers = require('../people.json') as Speaker[];
const state = createInitialState(speakers);

const app = express();
ws(app);

app.use(express.static(__dirname + '/..'));

app.ws('/', (ws, req) => {
  ws.send(JSON.stringify(state));

  let duration: number | undefined = undefined;
  let text: string | undefined = undefined;

  ws.on('message', async msg => {
    if (duration === undefined) {
      const parsedMsg = JSON.parse(msg);
      duration = parsedMsg.duration;
      text = parsedMsg.text;
    } else {
      const blobDuration = duration;
      duration = undefined;

      try {
        const speakerIds = speakers.map(s => s.id);
        const speakerId = await identifySpeaker(msg, speakerIds);
        const speakerState = state.speakers.filter(s => s.speaker.id === speakerId)[0];

        if (speakerState) {
          speakerState.time += blobDuration;
          state.lastSpeakerId = speakerId;
        }

        ws.send(JSON.stringify(state));
        // Send keyphrases in a second state message ws.send(JSON.stringify(state));
      } catch (e) {
        if (/not opened/.test(e.message)) {
          return;
        }

        console.error(e);
      }
    }
  });
});

app.listen(8080, () => {
  console.log('Web server running in http://localhost:8080');
});