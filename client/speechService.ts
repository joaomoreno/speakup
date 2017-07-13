import * as Speech from './Speech.Browser.Sdk';

function RecognizerSetup(subscriptionKey): Speech.Recognizer {
	var recognizerConfig = new Speech.RecognizerConfig(
		new Speech.SpeechConfig(
			new Speech.Context(
				new Speech.OS(navigator.userAgent, "Browser", null),
				new Speech.Device("SpeechSample", "SpeechSample", "1.0.00000"))),
		Speech.RecognitionMode.Dictation,
	);

	// Alternatively use SDK.CognitiveTokenAuthentication(fetchCallback, fetchOnExpiryCallback) for token auth
	var authentication = new Speech.CognitiveSubscriptionKeyAuthentication(subscriptionKey);

	return Speech.CreateRecognizer(recognizerConfig, authentication);
}

export class SpeechToTextService {

	private recognizer: Speech.Recognizer;

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
			}

			else if (event instanceof Speech.SpeechSimplePhraseEvent) {
				console.log(JSON.stringify(event.Result.DisplayText, null, 3));
			}

			else if (event instanceof Speech.SpeechDetailedPhraseEvent) {
				// console.log(JSON.stringify(event.Result., null, 3));
			}

			else if (event instanceof Speech.SpeechEndDetectedEvent) {
				console.log("Speech ended");
			}

			else if (event instanceof Speech.RecognitionEndedEvent) {
				console.log("Recognition ended");
			}

		})
			.On(() => {
				// The request succeeded. Nothing to do here.
			},
			(error) => {
				console.error(error);
			});
	}

}