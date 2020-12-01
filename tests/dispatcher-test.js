'use strict';

const path = require('path');
const mockRequire = require('mock-require');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const Log = require('@janiscommerce/log');

const { API, APIError, Dispatcher } = require('../lib');
const Fetcher = require('../lib/fetcher');

/* eslint-disable prefer-arrow-callback */

describe('Dispatcher', function() {

	let httpCode;
	let responseBody;
	let responseHeader;
	let responseHeaders;
	let responseCookie;
	let responseCookies;

	let extraProcess = () => {};

	afterEach(() => {
		httpCode = undefined;
		responseBody = undefined;
		responseHeader = undefined;
		responseHeaders = undefined;
		responseCookie = undefined;
		responseCookies = undefined;
		extraProcess = () => {};
	});

	const responseSetters = api => {
		if(httpCode)
			api.setCode(httpCode);

		if(responseHeader)
			api.setHeader(responseHeader.name, responseHeader.value);

		if(responseHeaders)
			api.setHeaders(responseHeaders);

		if(responseCookie)
			api.setCookie(responseCookie.name, responseCookie.value);

		if(responseCookies)
			api.setCookies(responseCookies);

		if(responseBody)
			api.setBody(responseBody);
	};

	const NoClass = { foo: 'bar' };

	class NoApiInheritance {}

	class NoProcess extends API {}

	class ValidProcess extends API {
		async process() {
			extraProcess(this);
			responseSetters(this);
		}
	}

	class ValidateOk extends ValidProcess {
		async validate() {
			return true;
		}
	}

	class ValidateRejectsDefault extends ValidProcess {
		async validate() {
			throw new Error();
		}
	}

	class ValidateRejects extends ValidProcess {
		async validate() {
			throw new Error('some data invalid');
		}
	}

	class ValidateRejectsCustomCode extends ValidProcess {
		async validate() {
			responseSetters(this);
			throw new Error();
		}
	}

	class Struct extends ValidProcess {
		get struct() {
			return { foo: 'string' };
		}
	}

	class StructMultiple extends ValidProcess {
		get struct() {
			return [{ foo: 'string', bar: 'number' }];
		}
	}

	class ProcessRejects extends API {
		async process() {
			throw new Error('some internal error');
		}
	}

	class ProcessRejectsDefault extends API {
		async process() {
			throw new Error();
		}
	}

	class ProcessRejectsCustomCode extends API {
		async process() {
			responseSetters(this);
			throw new Error();
		}
	}

	class LogsEnabled extends ValidProcess {
		get shouldCreateLog() {
			return true;
		}
	}

	class LogsDisabled extends ValidProcess {
		get shouldCreateLog() {
			return false;
		}
	}

	class LogsMinimal extends ValidProcess {
		get shouldCreateLog() {
			return true;
		}

		get shouldLogRequestHeaders() {
			return false;
		}

		get shouldLogRequestData() {
			return false;
		}

		get shouldLogResponseBody() {
			return false;
		}
	}

	const mock = (endpoint, classContent) => {
		mockRequire(path.join(Fetcher.apiPath, endpoint), classContent);
	};

	beforeEach(() => {
		mock('invalid-api-class-endpoint/list', NoClass);
		mock('invalid-api-inheritance/list', NoApiInheritance);
		mock('no-process-endpoint/list', NoProcess);
		mock('validate-rejects-endpoint/put', ValidateRejects);
		mock('validate-rejects-default-message-endpoint/post', ValidateRejectsDefault);
		mock('validate-rejects-custom-code-endpoint/post', ValidateRejectsCustomCode);
		mock('process-rejects-endpoint/post', ProcessRejects);
		mock('process-rejects-default-message-endpoint/post', ProcessRejectsDefault);
		mock('process-rejects-custom-code-endpoint/post', ProcessRejectsCustomCode);
		mock('struct-endpoint/list', Struct);
		mock('struct-multiple-endpoint/list', StructMultiple);
		mock('validate-correctly-endpoint/list', ValidateOk);
		mock('valid-endpoint/list', ValidProcess);
		mock('valid-endpoint/get', ValidProcess);
		mock('logs-enabled/list', LogsEnabled);
		mock('logs-enabled/get', LogsEnabled);
		mock('logs-disabled/list', LogsDisabled);
		mock('logs-disabled/get', LogsDisabled);
		mock('logs-minimal/list', LogsMinimal);
		mock('logs-minimal/get', LogsMinimal);
		sandbox.stub(Log, 'add').resolves();
	});

	afterEach(() => {
		delete process.env.MS_PATH;
		mockRequire.stopAll();
		sandbox.restore();
	});

	const test = async (myApiData, code, headers = {}, cookies = {}) => {
		const myApi = new Dispatcher(myApiData);
		const result = await myApi.dispatch();

		assert.deepStrictEqual(result.code, code, `Error in expected response HTTP Code ${code} !== ${result.code}`);
		assert.deepStrictEqual(result.headers, headers, 'Error in expected response headers');
		assert.deepStrictEqual(result.cookies, cookies, 'Error in expected response cookies');
	};

	context('invalid data received', function() {

		const testConstructorReject = (APIErrorCode, requestData) => {
			assert.throws(() => {
				new Dispatcher(requestData);
			}, {
				name: 'APIError',
				code: APIErrorCode
			});
		};

		const noStrings = [
			1,
			true,
			{ foo: 'bar' },
			['foo', 'bar']
		];

		const noObjects = [
			1,
			true,
			'foo',
			['foo', 'bar']
		];

		it('should reject when no request data given', function() {
			testConstructorReject(APIError.codes.INVALID_REQUEST_DATA);
		});

		it('should reject when no object request data received', function() {
			noObjects.forEach(requestData => testConstructorReject(APIError.codes.INVALID_REQUEST_DATA, requestData));
		});

		it('should reject when no enpoint given', function() {
			testConstructorReject(APIError.codes.INVALID_ENDPOINT, {});
		});

		it('should reject when invalid method given', function() {
			const endpoint = 'valid/endpoint';
			noStrings.forEach(method => testConstructorReject(APIError.codes.INVALID_METHOD, { endpoint, method }));
		});

		it('should reject when invalid headers given', function() {
			const endpoint = 'valid/endpoint';
			noObjects.forEach(headers => testConstructorReject(APIError.codes.INVALID_HEADERS, { endpoint, headers }));
		});

		it('should reject when invalid cookies given', function() {
			const endpoint = 'valid/endpoint';
			noObjects.forEach(cookies => testConstructorReject(APIError.codes.INVALID_COOKIES, { endpoint, cookies }));
		});

		it('should reject when invalid authentication data given', function() {
			const endpoint = 'valid/endpoint';
			noObjects.forEach(authenticationData => testConstructorReject(APIError.codes.INVALID_AUTHENTICATION_DATA, { endpoint, authenticationData }));
		});
	});

	context('5xx errors', function() {

		it('should return code 500 when api file hasn\'t a class', async function() {
			await test({
				endpoint: 'api/invalid-api-class-endpoint'
			}, 500);
		});

		it('should return code 500 when api does not inherit from API', async function() {
			await test({
				endpoint: 'api/invalid-api-inheritance'
			}, 500);
		});

		it('should return code 500 when api file found but api object has not a process method', async function() {
			await test({
				endpoint: 'api/no-process-endpoint'
			}, 500);
		});

		it('should return code 500 when api process method throw an internal server error', async function() {
			await test({
				endpoint: 'api/process-rejects-endpoint',
				method: 'post'
			}, 500);
		});

		it('should return code 500 when api process method throw an internal server error - default message', async function() {
			await test({
				endpoint: 'api/process-rejects-default-message-endpoint',
				method: 'post'
			}, 500);
		});

		it('should return a custom HTTP Code and default message when code given', async function() {

			httpCode = 501;

			await test({
				endpoint: 'api/process-rejects-custom-code-endpoint',
				method: 'post'
			}, 501);
		});
	});

	context('4xx errors', function() {

		it('should return code 404 when api file not found', async function() {
			await test({
				endpoint: 'api/unknown-endpoint'
			}, 404);
		});

		it('should return code 400 when api validate method throw a data invalid', async function() {
			await test({
				endpoint: 'api/validate-rejects-endpoint',
				method: 'put'
			}, 400);
		});

		it('should return code 400 when api validate method throw a data invalid - default message', async function() {
			await test({
				endpoint: 'api/validate-rejects-default-message-endpoint',
				method: 'post'
			}, 400);
		});

		it('should response with custom HTTP Code and default message when validate fails and code given', async function() {

			httpCode = 401;

			await test({
				endpoint: 'api/validate-rejects-custom-code-endpoint',
				method: 'post'
			}, 401);
		});

		it('should return code 400 when api data is invlaid against struct', async function() {
			await test({
				endpoint: 'api/struct-endpoint'
			}, 400);

			await test({
				endpoint: 'api/struct-endpoint',
				data: { unknownField: '123' }
			}, 400);
		});

		it('should return code 400 when api data is invlaid against struct multiple', async function() {
			await test({
				endpoint: 'api/struct-multiple-endpoint',
				data: { foo: '123' }
			}, 400);

			await test({
				endpoint: 'api/struct-multiple-endpoint',
				data: { bar: 123 }
			}, 400);
		});
	});

	context('2xx responses', function() {

		it('should return code 200 when api validates correctly', async function() {
			await test({
				endpoint: 'api/validate-correctly-endpoint'
			}, 200);
		});

		it('should return code 200 when api validates correctly the struct', async function() {
			await test({
				endpoint: 'api/struct-endpoint',
				data: { foo: 'bar' }
			}, 200);
		});

		it('should return code 200 when api has no validate method', async function() {
			await test({
				endpoint: 'api/valid-endpoint'
			}, 200);
		});

		it('should return api requestData with getters', async function() {

			extraProcess = api => {

				assert.deepStrictEqual(api.endpoint, 'valid-endpoint/10');
				assert.deepStrictEqual(api.pathParameters, ['10']);
				assert.deepStrictEqual(api.headers, { 'my-header': 'foo' });
				assert.deepStrictEqual(api.cookies, { 'my-cookie': 'bar' });
				assert.deepStrictEqual(api.session.clientCode, 'fizzmod');
			};

			await test({
				endpoint: 'api/valid-endpoint/10',
				headers: { 'my-header': 'foo' },
				cookies: { 'my-cookie': 'bar' },
				authenticationData: { clientCode: 'fizzmod' }
			}, 200);
		});

		it('should response with a custom HTTP Code when given', async function() {

			httpCode = 201;

			await test({
				endpoint: 'api/valid-endpoint'
			}, 201);
		});

		it('should return code 200 when api response and set headers', async function() {

			responseHeaders = { 'valid-header': 123 };

			await test({
				endpoint: 'api/valid-endpoint'
			}, 200, responseHeaders);
		});

		it('should return code 200 when api response and set an individual header', async function() {

			responseHeader = { name: 'valid-header', value: 123 };

			await test({
				endpoint: 'api/valid-endpoint'
			}, 200, { 'valid-header': 123 });
		});

		it('should return code 200 when api response and set cookies', async function() {

			responseCookies = { 'valid-cookie': 123 };

			await test({
				endpoint: 'api/valid-endpoint'
			}, 200, {}, responseCookies);
		});

		it('should return code 200 when api response and set an individual cookie', async function() {

			responseCookie = { name: 'valid-cookie', value: 123 };

			await test({
				endpoint: 'api/valid-endpoint'
			}, 200, {}, { 'valid-cookie': 123 });
		});

		it('should found api when using a prefix with ENV MS_PATH', async function() {

			process.env.MS_PATH = 'my-custom-prefix';

			mock('valid-with-prefix-endpoint/list', ValidProcess, 'my-custom-prefix');

			await test({
				endpoint: 'api/valid-with-prefix-endpoint'
			}, 200);
		});

	});

	context('when an api request is executed', function() {

		const defaultApi = {
			endpoint: 'api/logs-enabled',
			headers: {
				'janis-api-key': 'foo',
				'janis-api-secret': 'bar',
				'my-header': 'sarasa'
			},
			data: { some: 'data' },
			authenticationData: { clientCode: 'fizzmod' }
		};

		const commonLog = {
			id: sandbox.match.string,
			entity: 'api',
			type: 'api-request',
			log: {
				executionTime: sandbox.match.number
			}
		};

		it('should log the api request with userCreated field', async () => {

			responseBody = { message: 'ok' };
			responseHeaders = { 'res-header': 'some-data' };

			await test({
				...defaultApi,
				authenticationData: { ...defaultApi.authenticationData, userId: '5e7d07d6cf27a10008fe4d23' },
				endpoint: 'api/logs-enabled/10'
			}, 200, responseHeaders);

			sandbox.assert.calledWithMatch(Log.add, 'fizzmod', {
				...commonLog,
				entityId: 'logs-enabled',
				userCreated: '5e7d07d6cf27a10008fe4d23',
				log: {
					api: {
						endpoint: 'logs-enabled/10',
						httpMethod: 'get'
					},
					request: {
						headers: {
							'my-header': 'sarasa'
						},
						data: { some: 'data' }
					},
					response: {
						code: 200,
						headers: responseHeaders,
						body: responseBody
					}
				}
			});
		});

		it('should log the request without request data, headers and response body', async function() {

			responseBody = { message: 'ok' };

			await test({
				...defaultApi,
				endpoint: 'api/logs-minimal'
			}, 200);

			sandbox.assert.calledWithMatch(Log.add, 'fizzmod', {
				...commonLog,
				entityId: 'logs-minimal',
				log: {
					api: {
						endpoint: 'logs-minimal',
						httpMethod: 'get'
					},
					request: {},
					response: {
						code: 200
					}
				}
			});
		});

		it('should log the request exlcuding the specified fields of request data and response body', async function() {

			extraProcess = api => {

				api.excludeFieldsLogRequestData = [
					'password',
					'address'
				];

				api.excludeFieldsLogResponseBody = [
					'password',
					'secretCode'
				];
			};

			responseBody = {
				message: 'ok',
				password: 'foobar',
				authData: {
					secretCode: 1,
					publicCode: 2
				}
			};

			await test({
				...defaultApi,
				data: {
					some: 'data',
					password: 'foobar',
					location: {
						address: 'Fake St. 123',
						country: 'AR'
					}
				}
			}, 200);

			sandbox.assert.calledWithMatch(Log.add, 'fizzmod', {
				...commonLog,
				entityId: 'logs-enabled',
				log: {
					api: {
						endpoint: 'logs-enabled',
						httpMethod: 'get'
					},
					request: {
						data: {
							some: 'data',
							password: sandbox.match.undefined,
							location: {
								address: sandbox.match.undefined,
								country: 'AR'
							}
						}
					},
					response: {
						code: 200,
						body: {
							message: 'ok',
							password: sandbox.match.undefined,
							authData: {
								secretCode: sandbox.match.undefined,
								publicCode: 2
							}
						}
					}
				}
			});
		});

		it('should not log the api request with get method when api.shouldCreateLog is not set', async function() {
			await test({
				...defaultApi,
				endpoint: 'api/valid-endpoint'
			}, 200);
			sandbox.assert.notCalled(Log.add);
		});

		it('should not log the api request when api.shouldCreateLog is false', async function() {

			await test({
				...defaultApi,
				endpoint: 'api/logs-disabled'
			}, 200);
			sandbox.assert.notCalled(Log.add);
		});
	});
});
