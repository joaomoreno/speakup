import * as express from 'express';
import * as ws from 'express-ws';
import { identifySpeaker } from "./lib/speaker-recognition";
import { getKeyPhrases } from "./lib/text-analytics";

const showJohnDoe = true;

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
const speakers = require('../people.json') as Speaker[];

function createInitialState(speakers: Speaker[]): State {
	const speakerStates = [
		...speakers.map(speaker => ({ speaker, time: 0, keyphrases: [] }))
	];

	if (showJohnDoe) {
		speakerStates.push({ speaker: { id: unknownId, name: 'John Doe' }, time: 0, keyphrases: [] });
	}

	return {
		speakers: speakerStates,
		lastSpeakerId: undefined
	};
}

interface Speeches {
	[key: string]: string;
}

function createInitialSpeeches(speakers: Speaker[]): Speeches {
	return speakers.reduce((r, s) => ({ ...r, [s.id]: '' }), {});
}

const app = express();
ws(app);

app.use(express.static(__dirname + '/..'));

app.ws('/', (ws, req) => {
	const speeches = createInitialSpeeches(speakers);
	const state = createInitialState(speakers);
	ws.send(JSON.stringify(state));

	let duration: number | undefined = undefined;
	let text: string | undefined = undefined;

	ws.on('message', async msg => {
		if (duration === undefined || text === undefined) {
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
				// Send keyphrases in a second state message
				if (speeches[speakerId] !== undefined) { // If speaker identified, send it
					speeches[speakerId] === '' ? `${text}.` : `${speeches[speakerId]} ${text}.`;

					const keyphrases = await getKeyPhrases(speeches[speakerId], speakerId, 5);
					speakerState.keyphrases = keyphrases;
					ws.send(JSON.stringify(state));
				}
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