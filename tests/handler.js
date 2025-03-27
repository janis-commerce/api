'use strict';

const assert = require('assert');
const sinon = require('sinon');

const Events = require('@janiscommerce/events');
const Log = require('@janiscommerce/log');

const LogHelper = require('../lib/helpers/log');

const { Handler, API } = require('../lib');

const {
	NoProcess,
	InvalidDataSchema,
	StructAndDataSchema,
	EmptyProcess,
	ValidProcess,
	ValidProcessWithBody,
	ValidProcessWithHeader,
	ValidProcessWithHeaders,
	ValidProcessWithCookie,
	ValidProcessWithCookies,
	ValidProcessWithEmptyCookies,
	ValidProcessWithCustomizedCookie,
	ValidProcessWithCustomizedCookieWithDefaults,
	ValidProcessWithHeadersAndCookies,
	ValidateOk,
	ValidateRejects,
	ValidateRejectsString,
	ValidateRejectsCustomCode,
	Struct,
	StructMultiple,
	DataSchema,
	RequestPassthrough,
	RequestGettersPassthrough,
	ProcessRejects,
	ProcessRejectsString,
	ProcessRejectsCustomCode,
	ProcessRejectsWithVariables,
	LogsDisabled,
	LogsMinimal,
	LogsWithLessData
} = require('./resources/apis');
const getApiRequest = require('./resources/get-api-request');
const putApiRequest = require('./resources/put-api-request');

describe('Handler', () => {

	/**
	 * @callback assertResponseFn
	 * @param {{ clientCode?: string, code: number, statusCodeForPatternMatching: string, body?: any, headers?: Record<string, string> }} parsedResponse
	 */

	/**
	 * @param {import('../lib/types/response').JsonString<import('../lib/types/response').RawResponsePayload>} response
	 * @param {number|null} statusCode
	 * @param {assertResponseFn} [assertFn]
	 */
	const assertResponse = (response, statusCode, assertFn) => {

		const parsedResponse = JSON.parse(response);

		if(typeof statusCode !== 'undefined') {
			assert.strictEqual(parsedResponse.code, statusCode, `${parsedResponse.code}: ${parsedResponse.body}`);
			assert.strictEqual(parsedResponse.statusCodeForPatternMatching, `[${statusCode}]`);
		}

		const parsedBody = parsedResponse.body && JSON.parse(parsedResponse.body);

		if(assertFn) {
			assertFn({
				...parsedResponse,
				body: parsedBody
			});
		}

	};

	describe('Implementation errors', () => {

		beforeEach(() => {
			sinon.stub(Log, 'start');
			sinon.stub(LogHelper, 'save');
			sinon.stub(Events, 'emit');
		});

		afterEach(() => {
			sinon.restore();
		});

		it('Should throw an Error if API has an invalid data schema', async () => {

			assert.throws(() => new Handler(InvalidDataSchema), {
				message: 'Invalid schema.'
			});

			sinon.assert.notCalled(Log.start);
			sinon.assert.notCalled(LogHelper.save);
			sinon.assert.notCalled(Events.emit);
		});

		it('Should throw an Error if API has both struct and data schema defined', async () => {

			assert.throws(() => new Handler(StructAndDataSchema), {
				message: 'Cannot use struct and dataSchema at the same time'
			});

			sinon.assert.notCalled(Log.start);
			sinon.assert.notCalled(LogHelper.save);
			sinon.assert.notCalled(Events.emit);
		});

		it('Should return a 500 error if the API has no process method defined', async () => {

			const response = await new Handler(NoProcess).handle(getApiRequest);

			assertResponse(response, 500, parsedResponse => {
				assert.strictEqual(parsedResponse.body.message, 'Missing implementation for API.process');
			});

			sinon.assert.calledOnceWithExactly(Log.start);
			sinon.assert.calledOnceWithExactly(Events.emit, 'janiscommerce.ended');
			sinon.assert.calledOnceWithExactly(LogHelper.save, sinon.match.instanceOf(API));
		});

	});

	describe('Valid implementations', () => {

		beforeEach(() => {
			sinon.stub(Log, 'start');
			sinon.stub(LogHelper, 'save');
			sinon.stub(Events, 'emit');
		});

		afterEach(() => {
			sinon.assert.calledOnceWithExactly(Log.start);
			sinon.assert.calledOnceWithExactly(Events.emit, 'janiscommerce.ended');
			sinon.assert.calledOnceWithExactly(LogHelper.save, sinon.match.instanceOf(API));
			sinon.restore();
		});

		describe('Invalid requests', () => {

			it('Should return a 400 error if the request data does not match the API struct', async () => {
				const response = await new Handler(Struct).handle({
					...getApiRequest,
					query: {
						'foo[0]': 1
					}
				});

				assertResponse(response, 400, parsedResponse => {
					assert.strictEqual(parsedResponse.body.message, 'Expected a value of type `string` for `foo` but received `["1"]`.');
				});
			});

			it('Should return a 400 error if the request data does not match the API Schema', async () => {
				const response = await new Handler(DataSchema).handle({
					...getApiRequest,
					query: {
						'foo[0]': 1
					}
				});

				assertResponse(response, 400, parsedResponse => {
					assert.strictEqual(parsedResponse.body.message, 'The \'foo\' field must be a string.');
				});
			});

			it('Should return a 400 error if the custom validation rejects without setting a custom status code', async () => {
				const response = await new Handler(ValidateRejects).handle(getApiRequest);

				assertResponse(response, 400, parsedResponse => {
					assert.strictEqual(parsedResponse.body.message, 'Default validate error');
				});
			});

			it('Should return a 400 error if the custom validation rejects a string without setting a custom status code', async () => {
				const response = await new Handler(ValidateRejectsString).handle(getApiRequest);

				assertResponse(response, 400, parsedResponse => {
					assert.strictEqual(parsedResponse.body.message, 'Default validate error');
				});
			});

			it('Should return a 404 error if the custom validation rejects setting a the status code first', async () => {

				const response = await new Handler(ValidateRejectsCustomCode).handle(getApiRequest);

				assertResponse(response, 404, parsedResponse => {
					assert.strictEqual(parsedResponse.body.message, 'Entity not found');
				});
			});
		});

		describe('Request parsing', () => {

			it('Should parse request cookies and set them in API.cookies if received', async () => {

				const response = await new Handler(RequestPassthrough).handle({
					...getApiRequest,
					headers: {
						...getApiRequest.headers,
						Cookie: 'cookie1=value1; cookie2=value2'
					}
				});

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.body.cookies, {
						cookie1: 'value1',
						cookie2: 'value2'
					});
				});
			});

			it('Should parse query string and set them in API.data if received', async () => {

				const response = await new Handler(RequestPassthrough).handle({
					...getApiRequest,
					query: {
						foo: 'bar',
						'array[0]': '1',
						'array[1]': '2'
					}
				});

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.body.data, {
						foo: 'bar',
						array: ['1', '2']
					});
				});
			});

			it('Should set API.data as an empty object if query string is empty', async () => {

				const response = await new Handler(RequestPassthrough).handle({
					...getApiRequest,
					query: {}
				});

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.body.data, {});
				});
			});

			it('Should set API.data as an empty object if body is empty', async () => {

				const response = await new Handler(RequestPassthrough).handle({
					...putApiRequest,
					body: null
				});

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.body.data, {});
				});
			});

			it('Should set API.headers as an empty object if headers are empty', async () => {

				const response = await new Handler(RequestPassthrough).handle({
					...getApiRequest,
					headers: {}
				});

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.body.headers, {});
				});
			});

			it('Should set API.session.authenticationData as an empty object if janisAuth is not set', async () => {

				const { janisAuth, ...restAuthorizer } = getApiRequest.authorizer;

				const response = await new Handler(RequestPassthrough).handle({
					...getApiRequest,
					authorizer: restAuthorizer
				});

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.body.session.authenticationData, {});
					assert.strictEqual(parsedResponse.body.session.clientCode, undefined);
				});
			});

			it('Should set rawBody, pathParameters and rawPathParameters and make them available as getters', async () => {

				const response = await new Handler(RequestGettersPassthrough).handle({
					...putApiRequest,
					headers: {
						...putApiRequest.headers,
						Cookie: 'cookie1=value1; cookie2=value2'
					}
				});

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.body.rawData, putApiRequest.rawBody);
					assert.deepStrictEqual(parsedResponse.body.rawPathParameters, putApiRequest.path);
					assert.deepStrictEqual(parsedResponse.body.pathParameters, [putApiRequest.path.id]);
					assert.deepStrictEqual(parsedResponse.body.cookies, {
						cookie1: 'value1',
						cookie2: 'value2'
					});
				});
			});
		});

		describe('Failed executions', () => {

			it('Should return a 500 error if the API process rejects without setting a custom status code', async () => {

				const response = await new Handler(ProcessRejects).handle(getApiRequest);

				assertResponse(response, 500, parsedResponse => {
					assert.strictEqual(parsedResponse.body.message, 'Some internal error');
				});
			});

			it('Should return a 500 error if the API process rejects a string without setting a custom status code', async () => {
				const response = await new Handler(ProcessRejectsString).handle(getApiRequest);

				assertResponse(response, 500, parsedResponse => {
					assert.strictEqual(parsedResponse.body.message, 'Some internal error');
				});
			});

			it('Should return a 503 error if the API process rejects setting a the status code first', async () => {

				const response = await new Handler(ProcessRejectsCustomCode).handle(getApiRequest);

				assertResponse(response, 503, parsedResponse => {
					assert.strictEqual(parsedResponse.body.message, 'Some internal error');
				});
			});

			it('Should return the error and the variables in case they are defined', async () => {

				const response = await new Handler(ProcessRejectsWithVariables).handle(getApiRequest);

				assertResponse(response, 500, parsedResponse => {
					assert.strictEqual(parsedResponse.body.message, 'Some internal error');
					assert.deepStrictEqual(parsedResponse.body.messageVariables, {
						foo: 'bar'
					});
				});
			});
		});

		describe('Successfull executions', () => {

			it('Should resolve with a 200 by default if no status code is set and no errors occur', async () => {

				const response = await new Handler(EmptyProcess).handle(getApiRequest);

				assertResponse(response, 200);
			});

			it('Should include the clientCode in the response if it is set', async () => {

				const response = await new Handler(EmptyProcess).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.strictEqual(parsedResponse.clientCode, 'sample-client');
				});
			});

			it('Should not include the clientCode in the response if it is not set', async () => {

				const response = await new Handler(EmptyProcess).handle({
					...getApiRequest,
					authorizer: {
						integrationLatency: '0',
						principalId: '',
						janisAuth: '{}'
					}
				});

				assertResponse(response, 200, parsedResponse => {
					assert(typeof parsedResponse.clientCode === 'undefined', 'Client code should not be set');
				});
			});

			it('Should call API.process and resolve with a 200 if no errors occur', async () => {

				const response = await new Handler(ValidProcess).handle(getApiRequest);

				assertResponse(response, 200);
			});

			it('Should check struct and resolve with a 200 if no errors occur', async () => {

				const response = await new Handler(Struct).handle(getApiRequest);

				assertResponse(response, 200);
			});

			it('Should set default values if struct is an array with 2 elements', async () => {

				const response = await new Handler(StructMultiple).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.body, {
						foo: 'bar',
						bar: 10 // Default value
					});
				});
			});

			it('Should check data schema and resolve with a 200 if no errors occur', async () => {

				const response = await new Handler(DataSchema).handle(getApiRequest);

				assertResponse(response, 200);
			});

			it('Should call API.validate and API.process and resolve with a 200 if no errors occur', async () => {

				const response = await new Handler(ValidateOk).handle(getApiRequest);

				assertResponse(response, 200);
			});

			it('Should return the response body if it is set', async () => {

				const response = await new Handler(ValidProcessWithBody).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.strictEqual(parsedResponse.body.success, true);
				});
			});

			it('Should return the response header when a single one is set', async () => {

				const response = await new Handler(ValidProcessWithHeader).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.headers, {
						'x-foo': 'bar'
					});
				});
			});

			it('Should return the response headers when multiple are set', async () => {

				const response = await new Handler(ValidProcessWithHeaders).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.headers, {
						'x-test': 'yes',
						'x-foo': 'bar',
						'x-baz': 'test'
					});
				});
			});

			it('Should return the response cookie as header when a single one is set', async () => {

				const response = await new Handler(ValidProcessWithCookie).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.headers, {
						'Set-Cookie': 'x-foo=bar'
					});
				});
			});

			it('Should return the first response cookie as header when multiple are set', async () => {

				const response = await new Handler(ValidProcessWithCookies).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.headers, {
						'Set-Cookie': 'x-foo=bar'
					});
				});
			});

			it('Should handle empty cookies object without throwing an error', async () => {

				const response = await new Handler(ValidProcessWithEmptyCookies).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.headers, {});
				});
			});

			it('Should handle cookies as objects with custom options', async () => {

				const response = await new Handler(ValidProcessWithCustomizedCookie).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.headers, {
						'Set-Cookie': 'x-foo=bar; HttpOnly; Secure; Path=/; Expires=Fri, 21 Mar 2025 21:00:00 GMT; Domain=janis.in'
					});
				});
			});

			it('Should handle cookies as objects with default options', async () => {

				const response = await new Handler(ValidProcessWithCustomizedCookieWithDefaults).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.headers, {
						'Set-Cookie': 'x-foo=bar'
					});
				});
			});

			it('Should return headers and cookies when both are set', async () => {

				const response = await new Handler(ValidProcessWithHeadersAndCookies).handle(getApiRequest);

				assertResponse(response, 200, parsedResponse => {
					assert.deepStrictEqual(parsedResponse.headers, {
						'x-test': 'yes',
						'x-foo': 'bar',
						'x-baz': 'test',
						'Set-Cookie': 'x-foo=bar'
					});
				});
			});
		});
	});

	describe('Logs handling', () => {

		beforeEach(() => {
			sinon.stub(Log, 'start');
			sinon.stub(Log, 'add');
			sinon.stub(Events, 'emit');
		});

		afterEach(() => {
			sinon.assert.calledOnceWithExactly(Log.start);
			sinon.assert.calledOnceWithExactly(Events.emit, 'janiscommerce.ended');
			sinon.restore();
		});

		const defaultHeadersToSkip = ['janis-api-key', 'janis-api-secret'];

		/**
		 * @param {Record<string, string>} headers
		 * @param {string[]} headersToSkip
		 * @returns {Record<Lowercase<string>, string>}
		 */
		// eslint-disable-next-line max-len
		const lowerCaseHeaders = (headers, headersToSkip = defaultHeadersToSkip) => Object.entries(headers).reduce((/** @type {Record<string, string>} */accum, [key, value]) => {
			const lowerCaseKey = key.toLowerCase();

			if(headersToSkip.includes(lowerCaseKey))
				return accum;

			accum[key.toLowerCase()] = value;
			return accum;
		}, {});

		it('Should not save logs for GET requests by default', async () => {

			await new Handler(ValidProcessWithBody).handle(getApiRequest);

			sinon.assert.notCalled(Log.add);
		});

		it('Should save logs for non-GET requests by default', async () => {

			await new Handler(ValidProcessWithBody).handle(putApiRequest);

			sinon.assert.calledOnceWithExactly(Log.add, 'sample-client', {
				id: sinon.match.string,
				entity: 'order',
				entityId: '642de364ca91aecf25677c0d',
				type: 'api-request',
				message: 'PUT /api/order/642de364ca91aecf25677c0d (200)',
				log: {
					executionTime: sinon.match.number,
					api: { endpoint: '/order/642de364ca91aecf25677c0d', httpMethod: 'put' },
					request: { headers: lowerCaseHeaders(putApiRequest.headers), data: { foo: 'bar' } },
					response: { code: 200, headers: {}, body: { success: true } }
				}
			});
		});

		it('Should not save logs if shouldCreateLog is set as false', async () => {

			await new Handler(LogsDisabled).handle(putApiRequest);

			sinon.assert.notCalled(Log.add);
		});

		// eslint-disable-next-line max-len
		it('Should not save request headers, body and response body if shouldLogRequestHeaders, shouldLogRequestData and shouldLogResponseBody are set as false', async () => {

			await new Handler(LogsMinimal).handle(putApiRequest);

			sinon.assert.calledOnceWithExactly(Log.add, 'sample-client', {
				id: sinon.match.string,
				entity: 'order',
				entityId: '642de364ca91aecf25677c0d',
				type: 'api-request',
				message: 'PUT /api/order/642de364ca91aecf25677c0d (200)',
				log: {
					executionTime: sinon.match.number,
					api: { endpoint: '/order/642de364ca91aecf25677c0d', httpMethod: 'put' },
					request: {},
					response: { code: 200, headers: {} }
				}
			});
		});

		it('Should save request pristine data, even if data is modified in API process or validation', async () => {

			const requestData = { foo: 'test' };
			const requestDataWithDefaults = { foo: 'test', bar: 10 };

			await new Handler(StructMultiple).handle({
				...putApiRequest,
				body: requestData,
				rawBody: JSON.stringify(requestData)
			});

			sinon.assert.calledOnceWithExactly(Log.add, 'sample-client', {
				id: sinon.match.string,
				entity: 'order',
				entityId: '642de364ca91aecf25677c0d',
				type: 'api-request',
				message: 'PUT /api/order/642de364ca91aecf25677c0d (200)',
				log: {
					executionTime: sinon.match.number,
					api: { endpoint: '/order/642de364ca91aecf25677c0d', httpMethod: 'put' },
					request: { headers: lowerCaseHeaders(putApiRequest.headers), data: requestData },
					response: { code: 200, headers: {}, body: requestDataWithDefaults }
				}
			});
		});

		it('Should remove the fields from request and response set in shouldRemoveRequestFields and shouldRemoveResponseFields', async () => {

			const requestData = { foo: 'foo', depthOne: { bar: 'bar' }, baz: 'baz' };
			const requestDataLimited = { depthOne: { bar: 'bar' }, baz: 'baz' };
			const responseData = { foo: 'foo', depthOne: { bar: 'bar' }, baz: 'baz' };
			const responseDataLimited = { foo: 'foo', depthOne: {}, baz: 'baz' };

			const response = await new Handler(LogsWithLessData).handle({
				...putApiRequest,
				body: requestData,
				rawBody: JSON.stringify(requestData)
			});

			assertResponse(response, 200, parsedResponse => {
				assert.deepStrictEqual(parsedResponse.body, responseData);
			});

			sinon.assert.calledOnceWithExactly(Log.add, 'sample-client', {
				id: sinon.match.string,
				entity: 'order',
				entityId: '642de364ca91aecf25677c0d',
				type: 'api-request',
				message: 'PUT /api/order/642de364ca91aecf25677c0d (200)',
				log: {
					executionTime: sinon.match.number,
					api: { endpoint: '/order/642de364ca91aecf25677c0d', httpMethod: 'put' },
					request: { headers: lowerCaseHeaders(putApiRequest.headers), data: requestDataLimited },
					response: { code: 200, headers: {}, body: responseDataLimited }
				}
			});
		});

		// eslint-disable-next-line max-len
		it('Should remove the fields from request and response set in shouldRemoveRequestFields and shouldRemoveResponseFields when data is array', async () => {

			const requestData = [{ foo: 'foo', depthOne: { bar: 'bar' }, baz: 'baz' }, { baz: 'baz' }];
			const requestDataLimited = [{ depthOne: { bar: 'bar' }, baz: 'baz' }, { baz: 'baz' }];
			const responseData = [{ foo: 'foo', depthOne: { bar: 'bar' }, baz: 'baz' }, { baz: 'baz' }];
			const responseDataLimited = [{ foo: 'foo', depthOne: {}, baz: 'baz' }, { baz: 'baz' }];

			const response = await new Handler(LogsWithLessData).handle({
				...putApiRequest,
				body: requestData,
				rawBody: JSON.stringify(requestData)
			});

			assertResponse(response, 200, parsedResponse => {
				assert.deepStrictEqual(parsedResponse.body, responseData);
			});

			sinon.assert.calledOnceWithExactly(Log.add, 'sample-client', {
				id: sinon.match.string,
				entity: 'order',
				entityId: '642de364ca91aecf25677c0d',
				type: 'api-request',
				message: 'PUT /api/order/642de364ca91aecf25677c0d (200)',
				log: {
					executionTime: sinon.match.number,
					api: { endpoint: '/order/642de364ca91aecf25677c0d', httpMethod: 'put' },
					request: { headers: lowerCaseHeaders(putApiRequest.headers), data: requestDataLimited },
					response: { code: 200, headers: {}, body: responseDataLimited }
				}
			});
		});

		it('Should save the log with a userCreated if the session has a userId', async () => {

			await new Handler(ValidProcessWithBody).handle({
				...putApiRequest,
				authorizer: {
					...putApiRequest.authorizer,
					janisAuth: JSON.stringify({
						...JSON.parse(putApiRequest.authorizer.janisAuth),
						userId: '3e7d1a73a1153442f36e9c64'
					})
				}
			});

			sinon.assert.calledOnceWithExactly(Log.add, 'sample-client', {
				id: sinon.match.string,
				entity: 'order',
				entityId: '642de364ca91aecf25677c0d',
				type: 'api-request',
				message: 'PUT /api/order/642de364ca91aecf25677c0d (200)',
				userCreated: '3e7d1a73a1153442f36e9c64',
				log: {
					executionTime: sinon.match.number,
					api: { endpoint: '/order/642de364ca91aecf25677c0d', httpMethod: 'put' },
					request: { headers: lowerCaseHeaders(putApiRequest.headers), data: { foo: 'bar' } },
					response: { code: 200, headers: {}, body: { success: true } }
				}
			});
		});

		it('Should add the serviceCode to the log if api key is from a service', async () => {

			await new Handler(ValidProcessWithBody).handle({
				...putApiRequest,
				headers: {
					...putApiRequest.headers,
					'janis-api-key': 'service-sample-service'
				}
			});

			sinon.assert.calledOnceWithExactly(Log.add, 'sample-client', {
				id: sinon.match.string,
				entity: 'order',
				entityId: '642de364ca91aecf25677c0d',
				type: 'api-request',
				message: 'PUT /api/order/642de364ca91aecf25677c0d (200)',
				log: {
					executionTime: sinon.match.number,
					api: { endpoint: '/order/642de364ca91aecf25677c0d', httpMethod: 'put' },
					request: {
						headers: lowerCaseHeaders(putApiRequest.headers),
						data: { foo: 'bar' },
						'janis-service-name': 'sample-service'
					},
					response: { code: 200, headers: {}, body: { success: true } }
				}
			});
		});
	});

});
