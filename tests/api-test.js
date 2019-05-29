'use strict';

const path = require('path');
const mockRequire = require('mock-require');

const assert = require('assert');

const API = require('./../index');
const { APIError, Fetcher } = require('./../api');

/* eslint-disable prefer-arrow-callback */

describe('API', function() {

	class ValidProcessClass {
		async process() {
			return 1;
		}
	}

	class ValidateOkClass extends ValidProcessClass {
		async validate() {
			return true;
		}
	}

	class ValidateRejectsDefaultClass extends ValidProcessClass {
		async validate() {
			throw new Error();
		}
	}

	class ValidateRejectsClass extends ValidProcessClass {
		async validate() {
			throw new Error('some data invalid');
		}
	}

	class StructClass extends ValidProcessClass {
		get struct() {
			return { foo: 'string' };
		}
	}

	class StructMultipleClass extends ValidProcessClass {
		get struct() {
			return [{ foo: 'string', bar: 'number' }];
		}
	}

	class ProcessRejectsClass {
		async process() {
			throw new Error('some internal error');
		}
	}

	class ProcessRejectsDefaultClass {
		async process() {
			throw new Error();
		}
	}

	const mock = (endpoint, classContent) => {
		mockRequire(path.join(Fetcher.apiPath, endpoint), classContent);
	};

	before(() => {
		mock('invalid-api-class-endpoint/list', { foo: 'bar' });
		mock('no-process-endpoint/list', class {});
		mock('process-rejects-endpoint/post', ProcessRejectsClass);
		mock('process-rejects-default-message-endpoint/post', ProcessRejectsDefaultClass);
		mock('validate-rejects-endpoint/put', ValidateRejectsClass);
		mock('validate-rejects-default-message-endpoint/post', ValidateRejectsDefaultClass);
		mock('struct-endpoint/list', StructClass);
		mock('struct-multiple-endpoint/list', StructMultipleClass);
		mock('validate-correctly-endpoint/list', ValidateOkClass);
		mock('valid-endpoint/list', ValidProcessClass);
	});

	after(() => {
		mockRequire.stopAll();
	});

	const test = async(myApi, code) => {
		const result = await myApi.dispatch();
		assert.deepEqual(result.code, code);
	};

	describe('should reject', function() {
		const testConstructorReject = (APIErrorCode, requestData) => {
			assert.throws(() => {
				new API(requestData);
			}, {
				name: 'APIError',
				code: APIErrorCode
			});
		};

		it('when no request data given', function() {
			testConstructorReject(APIError.codes.INVALID_REQUEST_DATA);
		});

		it('when no object request data received', function() {
			[
				'foo',
				true,
				['foo', 'bar'],
				16
			].forEach(requestData => testConstructorReject(APIError.codes.INVALID_REQUEST_DATA, requestData));
		});

		it('when no enpoint given', function() {
			testConstructorReject(APIError.codes.INVALID_ENDPOINT, {});
		});

		it('when invalid method given', function() {

			const endpoint = 'valid/endpoint';

			[
				1,
				true,
				{ foo: 'bar' },
				['foo', 'bar']
			].forEach(method => testConstructorReject(APIError.codes.INVALID_METHOD, { endpoint, method }));
		});

		it('when invalid headers given', function() {

			const endpoint = 'valid/endpoint';

			[
				1,
				true,
				'foo',
				['foo', 'bar']
			].forEach(headers => testConstructorReject(APIError.codes.INVALID_HEADERS, { endpoint, headers }));
		});

		it('when invalid cookies given', function() {

			const endpoint = 'valid/endpoint';

			[
				1,
				true,
				'foo',
				['foo', 'bar']
			].forEach(cookies => testConstructorReject(APIError.codes.INVALID_COOKIES, { endpoint, cookies }));
		});
	});

	describe('should return code 500', function() {

		it('when api file not found', async function() {
			await test(new API({
				endpoint: 'api/unknown-endpoint'
			}), 500);
		});

		it('when api file hasn\'t a class', async function() {
			await test(new API({
				endpoint: 'api/invalid-api-class-endpoint'
			}), 500);
		});

		it('when api file found but api object has not a process method', async function() {
			await test(new API({
				endpoint: 'api/no-process-endpoint'
			}), 500);
		});

		it('when api process method throw an internal server error', async function() {
			await test(new API({
				endpoint: 'api/process-rejects-endpoint',
				method: 'post'
			}), 500);
		});

		it('when api process method throw an internal server error - default message', async function() {
			await test(new API({
				endpoint: 'api/process-rejects-default-message-endpoint',
				method: 'post'
			}), 500);
		});
	});

	describe('should return code 400', function() {

		it('when api validate method throw a data invalid', async function() {
			await test(new API({
				endpoint: 'api/validate-rejects-endpoint',
				method: 'put'
			}), 400);
		});

		it('when api validate method throw a data invalid - default message', async function() {
			await test(new API({
				endpoint: 'api/validate-rejects-default-message-endpoint',
				method: 'post'
			}), 400);
		});

		it('when api data is invlaid against struct', async function() {
			await test(new API({
				endpoint: 'api/struct-endpoint'
			}), 400);

			await test(new API({
				endpoint: 'api/struct-endpoint',
				data: { unknownField: '123' }
			}), 400);
		});

		it('when api data is invlaid against struct multiple', async function() {
			await test(new API({
				endpoint: 'api/struct-multiple-endpoint',
				data: { foo: '123' }
			}), 400);

			await test(new API({
				endpoint: 'api/struct-multiple-endpoint',
				data: { bar: 123 }
			}), 400);
		});

	});

	describe('should return code 200', function() {

		it('when api validates correctly', async function() {
			await test(new API({
				endpoint: 'api/validate-correctly-endpoint'
			}), 200);
		});

		it('when api validates correctly the struct', async function() {
			await test(new API({
				endpoint: 'api/struct-endpoint',
				data: { foo: 'bar' }
			}), 200);
		});

		it('when api has no validate method', async function() {
			await test(new API({
				endpoint: 'api/valid-endpoint'
			}), 200);
		});
	});

});
