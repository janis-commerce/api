'use strict';

const assert = require('assert');

const { ErrorWithVariables } = require('../lib');

describe('Api ErrorWithVariables', () => {

	it('Should accept a message error and variables', () => {
		const error = new ErrorWithVariables('Some error', {
			foo: 'bar'
		});

		assert.strictEqual(error.message, 'Some error');
		assert.deepStrictEqual(error.messageVariables, {
			foo: 'bar'
		});
		assert.strictEqual(error.name, 'ErrorWithVariables');
	});

	it('Should accept an error instance and a code', () => {

		const previousError = new Error('Some error');

		const error = new ErrorWithVariables(previousError, {
			foo: 'bar'
		});

		assert.strictEqual(error.message, 'Some error');
		assert.deepStrictEqual(error.messageVariables, {
			foo: 'bar'
		});
		assert.strictEqual(error.name, 'ErrorWithVariables');
		assert.strictEqual(error.previousError, previousError);
	});
});
