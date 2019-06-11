'use strict';

class APIError extends Error {

	static get codes() {

		return {
			INVALID_REQUEST_DATA: 1,
			INVALID_ENDPOINT: 2,
			INVALID_METHOD: 3,
			INVALID_HEADERS: 4,
			INVALID_COOKIES: 5,
			API_NOT_FOUND: 6,
			INVALID_API: 7,
			INVALID_API_INHERITANCE: 8,
			PROCESS_METHOD_NOT_FOUND: 9
		};
	}

	/**
	*
	*	The error that will be used to form the response.
	*
	*	@param {mixed} err - The error object or error message
	*	@param {string} code - Response code key
	*	@private
	*/
	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'APIError';
	}
}

module.exports = APIError;
