'use strict';

module.exports = class ErrorWithVariables extends Error {

	/**
	 * @param {string|Error} err
	 * @param {Object<string, string|number>} variables
	 */
	constructor(err, variables) {

		super(err.message || err);
		this.messageVariables = variables;
		this.name = 'ErrorWithVariables';

		if(err instanceof Error)
			this.previousError = err;
	}
};
