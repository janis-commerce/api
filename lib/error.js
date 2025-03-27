'use strict';

/**
 * @enum {number}
 * @private
 */
const ERROR_CODES = {
	// used in api dispatcher validator...
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

		super(err instanceof Error ? err.message : err);

		/** @type {ERROR_CODES} */
		this.code = code;

		/** @type {string} */
		this.name = 'APIError';

		/** @type {number} */
		this.statusCode = 0;

		if(err instanceof Error)
			/** @type {Error} */
			this.previousError = err;
	}
};
