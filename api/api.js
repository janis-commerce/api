'use strict';

const { struct } = require('superstruct');

const Fetcher = require('./fetcher');
const APIError = require('./error');

class API {

	constructor(requestData) {
		this._validate(requestData);

		this.endpoint = requestData.endpoint;
		this.method = requestData.method || 'get';
		this.data = requestData.data || {};
		this.headers = requestData.headers || {};
		this.cookies = requestData.cookies || {};
	}

	/**
	 * Determines if object.
	 *
	 * @param {any} value The value
	 * @return {boolean} True if object, False otherwise.
	 */
	_isObject(value) {
		return typeof value === 'object' && !Array.isArray(value);
	}

	/**
	 * Validates the requestData
	 *
	 * @param {any} requestData The request data
	 */
	_validate(requestData) {

		if(!this._isObject(requestData))
			throw new APIError('request data must be an Object', APIError.codes.INVALID_REQUEST_DATA);

		if(typeof requestData.endpoint !== 'string')
			throw new APIError('endpoint must be an String', APIError.codes.INVALID_ENDPOINT);

		if(typeof requestData.method !== 'undefined'
			&& typeof requestData.method !== 'string')
			throw new APIError('method must be an String', APIError.codes.INVALID_METHOD);

		if(typeof requestData.headers !== 'undefined'
			&& !this._isObject(requestData.headers))
			throw new APIError('headers must be an Object', APIError.codes.INVALID_HEADERS);

		if(typeof requestData.cookies !== 'undefined'
			&& !this._isObject(requestData.cookies))
			throw new APIError('cookies must be an Object', APIError.codes.INVALID_COOKIES);
	}

	/**
	 * API Dispatch
	 *
	 * @return {Promise} Object with code and body
	 */
	async dispatch() {

		const fetcher = new Fetcher(this.endpoint, this.method);

		let apiController;

		try {

			apiController = fetcher.getAPIController();

			// If controller & process exists, execute method
			if(!apiController.process)
				throw new APIError('Method \'process\' not found', APIError.codes.PROCESS_METHOD_NOT_FOUND);

		} catch(err) {

			// devuelve un 500
			return {
				code: 500,
				message: err.message || 'internal server error'
			};
		}

		const pathParams = fetcher.getPathParameters();

		try {

			// Check data against struct if any
			this._validateStruct(apiController);

			// API request validation
			if(apiController.validate)
				await apiController.validate(this.data, ...pathParams);

		} catch(err) {

			// devuelve un 400
			return {
				code: 400,
				message: err.message || 'data invalid'
			};

		}

		let result;

		try {

			// call api controller process
			result = await apiController.process(this.data, ...pathParams);

		} catch(err) {

			return {
				code: 500,
				message: err.message || 'internal server error'
			};

		}

		return {
			code: 200,
			body: result
		};
	}


	/**
	 * Validates the struct
	 *
	 * @param {Object} api The api
	 */
	_validateStruct(api) {

		if(!api.struct) // Nothing to validate
			return;

		const args = !Array.isArray(api.struct) ? [api.struct] : api.struct;

		const Schema = struct(...args);

		const [error, parsed] = Schema.validate(this.data);

		if(error)
			throw new APIError(error.reason || error.message, 'DATA_INVALID', 'DATA_INVALID');

		this.data = parsed; // Parsed data with default value added.
	}

}

module.exports = API;
