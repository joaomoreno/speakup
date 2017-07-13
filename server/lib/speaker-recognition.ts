import * as request from 'request';
const subscriptionKey = require('../../devenv.json').subscriptionKey;

export async function identifySpeaker(audio: Buffer, identificationProfileIds: string[], operationLocation?: string): Promise<string> {
	if (!operationLocation) {
		operationLocation = await getOperationLocation(audio, identificationProfileIds);
	}

	const operationOptions = {
		url: operationLocation,
		method: 'GET',
		headers: {
			'Ocp-Apim-Subscription-Key': subscriptionKey
		}
	};

	return new Promise<string>((res, rej) => {
		request(operationOptions, (error, response, body) => {
			if (error) {
				return rej(error);
			}

			const result = JSON.parse(body);
			console.log(result);
			if (result.status === 'notstarted' || result.status === 'running') {
				return res(identifySpeaker(audio, identificationProfileIds, operationLocation)); // add recursion termination at some point, not to rely on service
			}

			if (result.status === 'failed' || result.processingResult.identifiedProfileId === '00000000-0000-0000-0000-000000000000') {
				return rej(`Identification failed or no speaker identified. ${result.message}`);
			}

			console.log(`${result.processingResult.identifiedProfileId}, probability: ${result.processingResult.confidence}`)
			return res(result.processingResult.identifiedProfileId);
		});
	});
}

function getOperationLocation(audio: Buffer, identificationProfileIds: string[]): Promise<string> {
	const options = {
		url: `https://westus.api.cognitive.microsoft.com/spid/v1.0/identify?identificationProfileIds=${identificationProfileIds.join(',')}`,
		method: 'POST',
		headers: {
			'Ocp-Apim-Subscription-Key': subscriptionKey
		},
		body: audio
	};

	return new Promise((res, rej) => {
		request(options, (error, response, body) => {
			if (error) {
				return rej(error);
			}
			console.log(body);
			const operationLocation = response.headers['operation-location'];
			if (operationLocation) {
				console.log(operationLocation);
				return typeof operationLocation === 'string' ? res(operationLocation) : rej('Operation location is not a string.');
			} else {
				return rej('Failed to obtain operation-location for a speaker.');
			}
		});
	});
}