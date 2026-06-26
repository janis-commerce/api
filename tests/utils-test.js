'use strict';

const assert = require('assert');

const { lowerCaseKeys } = require('../lib/utils');

describe('Utils', () => {

	describe('lowerCaseKeys()', () => {

		it('Should lowercase every top-level key', () => {
			assert.deepStrictEqual(lowerCaseKeys({
				'x-janis-Page': '3',
				'X-Janis-Page-Size': '20',
				'My-Header': 'foo'
			}), {
				'x-janis-page': '3',
				'x-janis-page-size': '20',
				'my-header': 'foo'
			});
		});

		it('Should return the value as-is when it is not an object', () => {
			[null, undefined, 'string', 1, true, ['a', 'b']].forEach(value => {
				assert.deepStrictEqual(lowerCaseKeys(value), value);
			});
		});
	});
});
