'use strict';

/**
 * @enum {number}
 * @private
 */
const ERROR_CODES = {
	// used in api dispacther validator...
	INVALID_REQUEST_DATA: 1,
	INVALID_ENDPOINT: 2,
	INVALID_METHOD: 3,
	INVALID_HEADERS: 4,
	INVALID_COOKIES: 5,
	INVALID_AUTHENTICATION_DATA: 9,
	// used in fetcher...
	API_NOT_FOUND: 6,
	INVALID_API: 7,
	// api validation
	INVALID_STRUCT: 8
};

module.exports = class APIError extends Error {

	static get codes() {
		return ERROR_CODES;
	}

	/**
	 * @param {string|Error} err
	 * @param {ERROR_CODES} code
	 */
	constructor(err, code) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.name = 'APIError';

		if(err instanceof Error)
			this.previousError = err;
	}
};
