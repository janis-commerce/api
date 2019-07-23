'use strict';

const path = require('path');
const mockRequire = require('mock-require');

const assert = require('assert');

const { API, Dispatcher } = require('./..');
const { APIError, Fetcher } = require('./../lib');

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
	});

	afterEach(() => {
		delete process.env.MS_PATH;
		mockRequire.stopAll();
	});

	const test = async (myApiData, code, headers = {}, cookies = {}) => {
		const myApi = new Dispatcher(myApiData);
		const result = await myApi.dispatch();

		assert.deepEqual(result.code, code, `Error in expected response HTTP Code ${code} !== ${result.code}`);
		assert.deepEqual(result.headers, headers, 'Error in expected response headers');
		assert.deepEqual(result.cookies, cookies, 'Error in expected response cookies');
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
	});

	context('5xx errors', function() {

		it('should return code 500 when api file not found', async function() {
			await test({
				endpoint: 'api/unknown-endpoint'
			}, 500);
		});

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
				assert.deepEqual(api.endpoint, 'valid-endpoint/10');
				assert.deepEqual(api.pathParameters, ['10']);
				assert.deepEqual(api.headers, { 'my-header': 'foo' });
				assert.deepEqual(api.cookies, { 'my-cookie': 'bar' });
			};

			await test({
				endpoint: 'api/valid-endpoint/10',
				headers: { 'my-header': 'foo' },
				cookies: { 'my-cookie': 'bar' }
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

});
