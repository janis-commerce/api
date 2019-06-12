'use strict';

class APIError extends Error {

	static get codes() {

		return {
			// used in api dispacther validator...
			INVALID_REQUEST_DATA: 1,
			INVALID_ENDPOINT: 2,
			INVALID_METHOD: 3,
			INVALID_HEADERS: 4,
			INVALID_COOKIES: 5,
			// used in fetcher...
			API_NOT_FOUND: 6,
			INVALID_API: 7,
			// api validation
			INVALID_STRUCT: 8
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
