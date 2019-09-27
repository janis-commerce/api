'use strict';

const assert = require('assert');

const { APIError } = require('../lib');

describe('Api Session Error', () => {

	it('Should accept a message error and a code', () => {
		const error = new APIError('Some error', APIError.codes.INVALID_REQUEST_DATA);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, APIError.codes.INVALID_REQUEST_DATA);
		assert.strictEqual(error.name, 'APIError');
	});

	it('Should accept an error instance and a code', () => {

		const previousError = new Error('Some error');

		const error = new APIError(previousError, APIError.codes.INVALID_REQUEST_DATA);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, APIError.codes.INVALID_REQUEST_DATA);
		assert.strictEqual(error.name, 'APIError');
		assert.strictEqual(error.previousError, previousError);
	});
});
