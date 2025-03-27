/* eslint-disable max-len */

'use strict';

/** @type {import('../../lib/types/request').RawRequestEvent} */
module.exports = {
	body: { foo: 'bar' },
	rawBody: '{"foo":"bar"}',
	method: 'PUT',
	principalId: 'user-3e7d1a73a1153442f36e9c64',
	stage: 'beta',
	headers: {
		accept: 'application/json',
		'accept-encoding': 'gzip, deflate, br, zstd',
		'accept-language': 'en-US,en;q=0.9,es;q=0.8,pt-BR;q=0.7,pt;q=0.6',
		'content-type': 'application/json',
		dnt: '1',
		Host: 'oms.janis.in',
		'janis-api-key': 'Bearer',
		'janis-api-secret': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIzOWYzOWZjLTgyZWQtNDYzNi04MWRlLTNhZDQ5MjAwZTAzZiJ9.eyJpZCI6IjVlN2QxMjczNjExNTI0MzJmMzZlOWM1NCIsInN1YiI6IjVlN2QxMjczNjExNTI0MzJmMzZlOWM1NCIsImtpbmQiOiJBVCIsImlzRGV2Ijp0cnVlLCJoYXNNdWx0aXBsZUNsaWVudHMiOnRydWUsImNsaWVudENvZGUiOiJmaXp6bW9kYXJnIiwicHJvZmlsZUlkIjoiNjMxZmFiNjY3YzFhNDY1YzFiY2M0Yzc3Iiwic2NvcGUiOlsib3BlbmlkIiwicHJvZmlsZSIsImVtYWlsIl0sInNlc3Npb25JZCI6IjY3YzIwZjNlZDIwMzIwYjEzYjAwZTcxZCIsImlhdCI6MTc0MDc3MTEzNCwiZXhwIjoxNzQwODU3NTM0LCJpc3MiOiJodHRwczovL2lkLmphbmlzZGV2LmluIn0.ZyrozhAH98-mmS7qf4gmhy5r6TeR2XFK6Z32j3ejwunidRRy9KdSoPHwMErKw3V6KcxdB6s7zqkZIa5t7t-6driea0IFdo0uhKw7OK01Fb8MAp6Zq9z1taPOOcH3JdHy0iUAC-B3MPoXZnCQdvjRrqi9rEHpie1pSGZmawgL76zhCdlS709gn9yVo6NELFdVpwIzPC8DUbF_sqsmJkep3L_9YKZJ88ugR3u8D8W6LIZ5ZzlgScR_t_La5Jf3zpcuShBLHDI040b6nvUM3diuSklmWo5YPLqQF2bXLfpF3TXkRIiuPi85PXcaXGoOB7TTCWBfEt7ZWCUXp2G0o0wYPfjA_NkWKleJD8YAQbQTBtZ-wlOQku77jDbs69OVbgFuSSojfBPDf1qcDdhEaNflQZhF1U1w_ONCTDai1Ea2BGo0JtWZUOlrgearxlZyVUP5JIomHfmZcQtdcq4qO74o4oR659fNcAJr_ozoOuhPrOaDjVWLxDT99Itiw2YdIqR0Z_DUeHE1SteJ34R2tWQmKrMlcmInzmpQUqslnoM9uxW2hQ3DXsRTveAna8p-NyZc45vLoAn5JMLWxTT_sZKpb_ayyTVPvEjLi07PtpGVQLOHqj4Pz1ictckpyqE412ZLkZfC3QBudvUbFemNtSARW8VdJXJWBCCXMvS40wW2QiQ',
		'janis-client': 'fizzmodarg',
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
		'X-Amzn-Trace-Id': 'Root=1-67c2311d-4447e58f5d57c042294a0334',
		'X-Forwarded-For': '0.0.0.0',
		'X-Forwarded-Port': '443',
		'X-Forwarded-Proto': 'https'
	},
	query: {},
	path: { id: '642de364ca91aecf25677c0d' },
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
	requestPath: '/order/{id}'
};
