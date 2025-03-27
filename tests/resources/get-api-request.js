/* eslint-disable max-len */

'use strict';

/** @type {import('../../lib/types/request').RawRequestEvent} */
module.exports = {
	body: {},
	rawBody: '{}',
	method: 'GET',
	principalId: 'user-3e7d1a73a1153442f36e9c64',
	stage: 'beta',
	headers: {
		accept: 'application/json, text/plain, */*',
		'accept-encoding': 'gzip, deflate, br, zstd',
		'accept-language': 'en-US,en;q=0.9,es;q=0.8,pt-BR;q=0.7,pt;q=0.6',
		dnt: '1',
		Host: 'oms.janis.in',
		'janis-api-key': 'Bearer',
		'janis-api-secret': 'some-access-token',
		'janis-client': 'sample-client',
		origin: 'https://app.janis.in',
		priority: 'u=1, i',
		referer: 'https://app.janis.in/',
		'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
		'sec-ch-ua-mobile': '?0',
		'sec-ch-ua-platform': '"macOS"',
		'sec-fetch-dest': 'empty',
		'sec-fetch-mode': 'cors',
		'sec-fetch-site': 'same-site',
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
		'X-Amzn-Trace-Id': 'Root=1-67c23111-584bf62c13d0490523807c0a',
		'X-Forwarded-For': '0.0.0.0',
		'X-Forwarded-Port': '443',
		'X-Forwarded-Proto': 'https',
		'x-janis-page': '1',
		'x-janis-page-size': '60',
		'x-janis-totals': 'false'
	},
	query: {
		foo: 'bar'
	},
	path: {},
	identity: {
		sourceIp: '0.0.0.0',
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
	},
	authorizer: {
		principalId: 'user-3e7d1a73a1153442f36e9c64',
		integrationLatency: '0',
		janisAuth: '{"clientCode":"sample-client"}'
	},
	stageVariables: {
		serviceName: 'oms'
	},
	requestContext: {},
	requestPath: '/order'
};
