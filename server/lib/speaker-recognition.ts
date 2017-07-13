import * as request from 'request';
import { unknownId } from "../server";
let subscriptionKey;
try {
	subscriptionKey = require('../../devenv.json').srKey;
} catch (e) {
	throw new Error('Please add `srKey` to devenv.json.');
}

export async function identifySpeaker(audio: Buffer, identificationProfileIds: string[], operationLocation?: string, retry: number = 0): Promise<string> {
	if (retry > 5) {
		return Promise.reject('Speaker identification timed out.');
	}

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
				return res(identifySpeaker(audio, identificationProfileIds, operationLocation, retry)); // add recursion termination at some point, not to rely on service
			}

			if (result.status === 'failed') {
				return rej(`Identification failed or no speaker identified. ${result.message}`);
			}

			if (result.processingResult.confidence !== 'High') {
				return res(unknownId);
			}

			return res(result.processingResult.identifiedProfileId);
		});
	});
}

function getOperationLocation(audio: Buffer, identificationProfileIds: string[]): Promise<string> {
	const options = {
		url: `https://westus.api.cognitive.microsoft.com/spid/v1.0/identify?identificationProfileIds=${identificationProfileIds.join(',')}&shortAudio=true`,
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
			const operationLocation = response.headers['operation-location'];
			if (operationLocation) {
				return typeof operationLocation === 'string' ? res(operationLocation) : rej('Operation location is not a string.');
			} else {
				return rej('Failed to obtain operation-location for a speaker.');
			}
		});
	});
}