'use strict';

const path = require('path');
const mockRequire = require('mock-require');

const assert = require('assert');

const API = require('./../index');
const { APIError, Fetcher } = require('./../api');

/* eslint-disable prefer-arrow-callback */

describe('API', function() {

	const mock = (endpoint, classContent) => {
		mockRequire(path.join(Fetcher.apiPath, endpoint), classContent);
	};

	before(() => {
		mock('no-process-endpoint/list', class {});
		mock('process-throws-endpoint/post', class {
			async process() {
				throw new Error('some internal error');
			}
		});
		mock('validate-throws-endpoint/put', class {
			async validate() {
				throw new Error('some data invalid');
			}

			async process() {
				return 1;
			}
		});
		mock('struct-endpoint/list', class {
			get struct() {
				return [{ foo: 'string' }];
			}

			async process() {
				return 1;
			}
		});
		mock('validate-correctly-endpoint/list', class {
			async validate() {
				return true;
			}

			async process() {
				return 1;
			}
		});
		mock('valid-endpoint/list', class {
			async process() {
				return 1;
			}
		});
	});

	after(() => {
		mockRequire.stopAll();
	});

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

		const test = async myApi => {
			const result = await myApi.dispatch();
			assert.deepEqual(result.code, 500);
		};

		it('when api file not found', async function() {
			await test(new API({
				endpoint: 'api/unknown-endpoint'
			}));
		});

		it('when api file found but api object has not a process method', async function() {
			await test(new API({
				endpoint: 'api/no-process-endpoint'
			}));
		});

		it('when api process method throw an internal server error', async function() {
			await test(new API({
				endpoint: 'api/process-throws-endpoint',
				method: 'post'
			}));
		});
	});

	describe('should return code 400', function() {

		const test = async myApi => {
			const result = await myApi.dispatch();
			assert.deepEqual(result.code, 400);
		};

		it('when api validate method throw a data invalid error', async function() {
			await test(new API({
				endpoint: 'api/validate-throws-endpoint',
				method: 'put'
			}));
		});

		it('when api data is invlaid against struct', async function() {
			await test(new API({
				endpoint: 'api/struct-endpoint'
			}));
		});

	});

	describe('should return code 200', function() {

		const test = async myApi => {
			const result = await myApi.dispatch();
			assert.deepEqual(result.code, 200);
		};

		it('when api validates correctly', async function() {
			await test(new API({
				endpoint: 'api/validate-correctly-endpoint'
			}));
		});

		it('when api validates correctly the struct', async function() {
			await test(new API({
				endpoint: 'api/struct-endpoint',
				data: { foo: 'bar' }
			}));
		});

		it('when api has no validate method', async function() {
			await test(new API({
				endpoint: 'api/valid-endpoint'
			}));
		});
	});

});
