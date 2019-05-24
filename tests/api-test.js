'use strict';

const mockRequire = require('mock-require');

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const API = require('./../index');
const { APIError } = require('./../api');

/* eslint-disable prefer-arrow-callback */

describe('API', function() {

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

	});

	describe('should return code 500', function() {


		// mockRequire('api/', schema);


	});

	describe('should return code 400', function() {

	});

	describe('should return code 200', function() {

	});


});
