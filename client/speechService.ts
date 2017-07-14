import * as Speech from './Speech.Browser.Sdk';
import { Emitter, Event } from './util';

function RecognizerSetup(subscriptionKey): Speech.Recognizer {
	var recognizerConfig = new Speech.RecognizerConfig(
		new Speech.SpeechConfig(
			new Speech.Context(
				new Speech.OS(navigator.userAgent, "Browser", null),
				new Speech.Device("SpeechSample", "SpeechSample", "1.0.00000"))),
		Speech.RecognitionMode.Interactive,
		"en-us",
		Speech.SpeechResultFormat.Detailed,
	);

	// Alternatively use SDK.CognitiveTokenAuthentication(fetchCallback, fetchOnExpiryCallback) for token auth
	var authentication = new Speech.CognitiveSubscriptionKeyAuthentication(subscriptionKey);

	return Speech.CreateRecognizer(recognizerConfig, authentication);
}

export class SpeechToTextService {

	private recognizer: Speech.Recognizer;

	private _onSpeechPaused: Emitter<string> = new Emitter<string>();
	readonly onSpeechPaused: Event<string> = this._onSpeechPaused.event;

	private lastText: string = '';
	private _onText: Emitter<string> = new Emitter<string>();
	readonly onText: Event<string> = this._onText.event;

	constructor(private subscriptionKey: string) {
		this.recognizer = RecognizerSetup(subscriptionKey);
		this.recognizer.AudioSource.TurnOn();
	}

	start(): void {
		this.recognizer.Recognize((event: Speech.SpeechRecognitionResultEvent<any>) => {

			if (event instanceof Speech.RecognitionTriggeredEvent) {
				console.log("Initializing");
			}

			else if (event instanceof Speech.ListeningStartedEvent) {
				console.log("Listening");
			}

			else if (event instanceof Speech.RecognitionStartedEvent) {
				console.log("Recognizing");
			}

			else if (event instanceof Speech.SpeechStartDetectedEvent) {
				console.log("Speech started");
			}

			else if (event instanceof Speech.SpeechHypothesisEvent) {
				if (event.Result.Text) {
					this.lastText = event.Result.Text;
					this._onText.fire(event.Result.Text);
				}
			}

			else if (event instanceof Speech.SpeechSimplePhraseEvent) {
				// if (event.Result.DisplayText) {
				// 	this._onText.fire(event.Result.DisplayText);
				// }
			}

			else if (event instanceof Speech.SpeechDetailedPhraseEvent) {
			}

			else if (event instanceof Speech.SpeechEndDetectedEvent) {
				this._onSpeechPaused.fire(this.lastText);
			}

			else if (event instanceof Speech.RecognitionEndedEvent) {
				this._onText.fire('');
				this.start();
			}

		})
			.On(() => {
			},
			(error) => {
				console.error(error);
			});
	}

}