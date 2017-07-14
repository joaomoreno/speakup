import * as request from 'request';
let subscriptionKey;
try {
    subscriptionKey = require('../../devenv.json').taKey;
} catch (e) {
    throw new Error('Please add `taKey` to devenv.json.');
}

export function getKeyPhrases(text: string, speakerId: string, top: number): Promise<string[]> {
    const doc = {
        "documents": [
            {
                "language": "en",
                "id": speakerId,
                "text": text
            }
        ]
    };
    const options = {
        url: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases',
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey
        },
        body: JSON.stringify(doc)
    };
    // console.log(doc);

    return new Promise<string[]>((res, rej) => {
        request(options, (error, response, body) => {
            if (error) {
                return rej(error);
            }

            const result = JSON.parse(body);
            // console.log(result);

            if (result.documents && result.documents[0] && result.documents[0].keyPhrases) {
                return res(result.documents[0].keyPhrases.slice(0, top));
            }
        });
    });
}