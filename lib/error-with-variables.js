'use strict';

module.exports = class ErrorWithVariables extends Error {

	/**
	 * @param {string|Error} err
	 * @param {Record<string,unknown>} variables
	 */
	constructor(err, variables) {

		super(err instanceof Error ? err.message : err);

		/** @type {Record<string,unknown>} */
		this.messageVariables = variables;

		/** @type {string} */
		this.name = 'ErrorWithVariables';

		/** @type {number} */
		this.statusCode = 0;

		if(err instanceof Error)
			/** @type {Error} */
			this.previousError = err;
	}
};
