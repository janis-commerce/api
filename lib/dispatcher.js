'use strict';

const { struct } = require('superstruct');

const Fetcher = require('./fetcher');

const API = require('./api');
const APIError = require('./error');
const Client = require('./client');

class Dispatcher {

	constructor(requestData) {
		this._validateRequestData(requestData);

		this.endpoint = requestData.endpoint.replace(/^\/?(api\/)?/i, '');
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
	_validateRequestData(requestData) {

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

	get fetcher() {

		if(!this._fetcher)
			this._fetcher = new Fetcher(this.endpoint, this.method);

		return this._fetcher;
	}

	/**
	 * API Dispatch
	 *
	 */
	async dispatch() {

		this.prepare();

		await this.setClient();

		await this.validate();

		await this.process();

		return this.response();
	}

	prepare() {

		try {

			this.api = this.fetcher.apiController;
			this.api.endpoint = this.endpoint;
			this.api.data = this.data;
			this.api.pathParameters = this.fetcher.pathParameters;
			this.api.headers = this.headers;
			this.api.cookies = this.cookies;

		} catch(err) {

			this.api = new API(); // para poder setear error correctamente

			/**
			 * Errores posibiles:
			 * 	1. no encuentra el archivo en api/path/file.js
			 * 	2. el archivo no exporta una clase
			 */
			this.setResponseError(err.message, 500);
		}
	}

	async setClient() {

		if(this.hasError)
			return;

		await Client.setActive(this.api);
	}

	async validate() {

		if(this.hasError)
			return;

		try {

			// Check data against struct if any
			this._validateStruct();

			// API request validation
			if(this.api.validate && typeof this.api.validate === 'function')
				await this.api.validate();

		} catch(err) {

			const code = 400;
			const message = err.message || 'data invalid';

			this.setResponseError(message, code);
		}
	}

	/**
	 * Validates the struct if any
	 *
	 */
	_validateStruct() {

		if(!this.api.struct)
			return; // Nothing to validate

		const args = !Array.isArray(this.api.struct) ? [this.api.struct] : this.api.struct;

		const Schema = struct(...args);

		const [error, parsed] = Schema.validate(this.api.data);

		if(error)
			throw new APIError(error.reason || error.message, APIError.codes.INVALID_STRUCT);

		this.api.data = parsed; // Parsed data with default value added.
	}

	async process() {

		if(this.hasError)
			return;

		try {

			// call api controller process
			await this.api.process();

		} catch(err) {

			const code = 500;
			const message = err.message || 'internal server error';

			this.setResponseError(message, code);
		}
	}

	setResponseError(message, httpCode) {
		this.hasError = true;

		if(!this.api.response.code)
			this.api.setCode(httpCode);

		this.api
			.setBody({ message });
	}

	response() {

		if(!this.api.response.code)
			this.api.setCode(200);

		return this.api.response;
	}
}

module.exports = Dispatcher;
