'use strict';

const path = require('path');
const mockRequire = require('mock-require');

const assert = require('assert');
const sinon = require('sinon');

const Log = require('@janiscommerce/log');

const Events = require('@janiscommerce/events');
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

	class NoProcessMethod {}

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

	class ProcessRejectsBody extends API {
		async process() {
			const error = new Error('some internal error');
			error.body = { foo: 'bar' };
			throw error;
		}
	}

	class ProcessRejectsWithVariables extends API {
		async process() {
			const error = new Error('some internal error');
			error.messageVariables = { foo: 'bar' };
			throw error;
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
		mock('no-process-method/list', NoProcessMethod);
		mock('no-process-endpoint/list', NoProcess);
		mock('validate-rejects-endpoint/put', ValidateRejects);
		mock('validate-rejects-default-message-endpoint/post', ValidateRejectsDefault);
		mock('validate-rejects-custom-code-endpoint/post', ValidateRejectsCustomCode);
		mock('process-rejects-endpoint/post', ProcessRejects);
		mock('process-rejects-body-endpoint/post', ProcessRejectsBody);
		mock('process-rejects-with-variables-endpoint/post', ProcessRejectsWithVariables);
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
		sinon.stub(Log, 'add').resolves();
	});

	afterEach(() => {
		delete process.env.MS_PATH;
		mockRequire.stopAll();
		sinon.restore();
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

		beforeEach(() => sinon.stub(Events, 'emit').resolves());
		afterEach(() => sinon.assert.calledOnceWithExactly(Events.emit, 'janiscommerce.ended'));

		it('should return code 500 when api file hasn\'t a class', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/invalid-api-class-endpoint'
			}), {
				message: /APIController is not a constructor/
			});
		});

		it('should return code 500 when api does not have a process method', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/no-process-method'
			}), {
				body: {
					message: 'API \'NoProcessMethod\' Method \'process\' not found'
				}
			});
		});

		it('should return code 500 when api file found but api object has not a process method', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/no-process-endpoint'
			}), {
				statusCode: 500,
				body: {
					message: 'Missing implementation for API.process'
				}
			});
		});

		it('should return code 500 when api process method throw an internal server error', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/process-rejects-endpoint',
				method: 'post'
			}), {
				statusCode: 500,
				body: {
					message: 'some internal error'
				}
			});
		});

		it('should return code 500 when api process method throw an internal server error - default message', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/process-rejects-default-message-endpoint',
				method: 'post'
			}), {
				statusCode: 500,
				body: {
					message: 'Internal server error'
				}
			});
		});

		it('should return a custom HTTP Code and default message when code given', async function() {

			httpCode = 501;

			await assert.rejects(() => test({
				endpoint: 'api/process-rejects-custom-code-endpoint',
				method: 'post'
			}), {
				statusCode: 501,
				body: {
					message: 'Internal server error'
				}
			});
		});

		it('should use error.body as response body if it is defined', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/process-rejects-body-endpoint',
				method: 'post'
			}), {
				statusCode: 500,
				body: {
					foo: 'bar'
				}
			});
		});

		it('should use error.message and error.messageVariables as response body if it is defined', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/process-rejects-with-variables-endpoint',
				method: 'post'
			}), {
				statusCode: 500,
				body: {
					message: 'some internal error',
					messageVariables: {
						foo: 'bar'
					}
				}
			});
		});
	});

	context('4xx errors', function() {

		beforeEach(() => sinon.stub(Events, 'emit').resolves());
		afterEach(() => sinon.assert.calledWithExactly(Events.emit, 'janiscommerce.ended'));

		it('should return code 404 when api file not found', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/unknown-endpoint'
			}), {
				statusCode: 404
			});
		});

		it('should return code 400 when api validate method throw a data invalid', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/validate-rejects-endpoint',
				method: 'put'
			}), {
				statusCode: 400,
				body: {
					message: 'some data invalid'
				}
			});
		});

		it('should return code 400 when api validate method throw a data invalid - default message', async function() {
			await assert.rejects(() => test({
				endpoint: 'api/validate-rejects-default-message-endpoint',
				method: 'post'
			}), {
				statusCode: 400,
				body: {
					message: 'Invalid data'
				}
			});
		});

		it('should response with custom HTTP Code and default message when validate fails and code given', async function() {

			httpCode = 401;

			await assert.rejects(() => test({
				endpoint: 'api/validate-rejects-custom-code-endpoint',
				method: 'post'
			}), {
				statusCode: 401,
				body: {
					message: 'Invalid data'
				}
			});
		});

		it('should return code 400 when api data is invalid against struct', async function() {

			await assert.rejects(() => test({
				endpoint: 'api/struct-endpoint'
			}), {
				statusCode: 400,
				body: {
					message: 'Expected a value of type `string` for `foo` but received `undefined`.'
				}
			});

			await assert.rejects(() => test({
				endpoint: 'api/struct-endpoint',
				data: { foo: 'bar', unknownField: '123' }
			}), {
				statusCode: 400,
				body: {
					message: 'Expected a value of type `undefined` for `unknownField` but received `"123"`.'
				}
			});

		});

		it('should return code 400 when api data is invalid against struct multiple', async function() {

			await assert.rejects(() => test({
				endpoint: 'api/struct-multiple-endpoint',
				data: { foo: '123' }
			}), {
				statusCode: 400,
				body: {
					message: 'Expected a value of type `number` for `bar` but received `undefined`.'
				}
			});

			await assert.rejects(() => test({
				endpoint: 'api/struct-multiple-endpoint',
				data: { bar: 123 }
			}), {
				statusCode: 400,
				body: {
					message: 'Expected a value of type `string` for `foo` but received `undefined`.'
				}
			});
		});
	});

	context('2xx responses', function() {

		beforeEach(() => sinon.stub(Events, 'emit').resolves());
		afterEach(() => sinon.assert.calledOnceWithExactly(Events.emit, 'janiscommerce.ended'));

		it('should return code 200 when api validates correctly', async function() {
			await test({
				endpoint: 'api/validate-correctly-endpoint'
			}, 200);
		});

		extraProcess = api => {
			assert.deepStrictEqual(api.data, {
				foo: 'foo',
				bar: ['bar'],
				baz: [{ test: 'test', numField: 123 }],
				nullField: null
			});
		};

		it('should return code 200 when api validates correctly & apply trim to data', async function() {

			extraProcess = api => {
				assert.deepStrictEqual(api.data, {
					foo: 'foo',
					bar: ['bar'],
					baz: [{ test: 'test', numField: 123 }],
					nullField: null
				});
			};

			await test({
				endpoint: 'api/valid-endpoint',
				data: {
					foo: '   foo  ',
					bar: [' bar  '],
					baz: [{ test: 'test ', numField: 123 }],
					nullField: null
				}
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
				assert.deepStrictEqual(api.data, { foo: 'bar' });
				assert.deepStrictEqual(api.rawData, JSON.stringify({ foo: 'bar' }));
			};

			await test({
				endpoint: 'api/valid-endpoint/10',
				headers: { 'my-header': 'foo' },
				cookies: { 'my-cookie': 'bar' },
				authenticationData: { clientCode: 'fizzmod' },
				data: { foo: 'bar' },
				rawData: JSON.stringify({ foo: 'bar' })
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

		beforeEach(() => sinon.stub(Events, 'emit').resolves());
		afterEach(() => sinon.assert.calledOnceWithExactly(Events.emit, 'janiscommerce.ended'));

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
			id: sinon.match.string,
			entity: 'api',
			type: 'api-request',
			log: {
				executionTime: sinon.match.number
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

			sinon.assert.calledWithMatch(Log.add, 'fizzmod', {
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

			sinon.assert.calledWithMatch(Log.add, 'fizzmod', {
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

		it('should log the request adding the janis-service-name when janis-api-key was service prefix', async function() {

			responseBody = { message: 'ok' };

			await test({
				...defaultApi,
				headers: {
					'janis-api-key': 'service-vtex-catalog'
				},
				endpoint: 'api/logs-minimal'
			}, 200);

			sinon.assert.calledWithMatch(Log.add, 'fizzmod', {
				...commonLog,
				entityId: 'logs-minimal',
				log: {
					api: {
						endpoint: 'logs-minimal',
						httpMethod: 'get'
					},
					request: {
						'janis-service-name': 'vtex-catalog'
					},
					response: {
						code: 200
					}
				}
			});
		});

		it('should log the request excluding the specified fields of request data and response body', async function() {

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

			sinon.assert.calledWithMatch(Log.add, 'fizzmod', {
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
							password: sinon.match.undefined,
							location: {
								address: sinon.match.undefined,
								country: 'AR'
							}
						}
					},
					response: {
						code: 200,
						body: {
							message: 'ok',
							password: sinon.match.undefined,
							authData: {
								secretCode: sinon.match.undefined,
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
			sinon.assert.notCalled(Log.add);
		});

		it('should not log the api request when api.shouldCreateLog is false', async function() {

			await test({
				...defaultApi,
				endpoint: 'api/logs-disabled'
			}, 200);
			sinon.assert.notCalled(Log.add);
		});
	});
});
