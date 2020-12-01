'use strict';

const { struct } = require('@janiscommerce/superstruct');
const { ApiSession } = require('@janiscommerce/api-session');

const Fetcher = require('./fetcher');
const { isObject } = require('./utils');

const API = require('./api');
const APIError = require('./error');

const LogHelper = require('./helpers/log');

module.exports = class Dispatcher {

	constructor(request) {
		this._validateRequest(request);

		this.endpoint = request.endpoint.replace(/^\/?(api\/)?/i, '');
		this.method = (request.method || 'get').toLowerCase();
		this.data = request.data || {};
		this.headers = request.headers || {};
		this.cookies = request.cookies || {};
		this.authenticationData = request.authenticationData || {};
		this.executionStarted = process.hrtime();
	}

	/**
	 * Validates the request
	 *
	 * @param {any} request The request data
	 */
	_validateRequest(request) {

		if(!isObject(request))
			throw new APIError('request data must be an Object', APIError.codes.INVALID_REQUEST_DATA);

		if(typeof request.endpoint !== 'string')
			throw new APIError('endpoint must be an String', APIError.codes.INVALID_ENDPOINT);

		if(typeof request.method !== 'undefined'
			&& typeof request.method !== 'string')
			throw new APIError('method must be an String', APIError.codes.INVALID_METHOD);

		if(typeof request.headers !== 'undefined'
			&& !isObject(request.headers))
			throw new APIError('headers must be an Object', APIError.codes.INVALID_HEADERS);

		if(typeof request.cookies !== 'undefined'
			&& !isObject(request.cookies))
			throw new APIError('cookies must be an Object', APIError.codes.INVALID_COOKIES);

		if(typeof request.authenticationData !== 'undefined'
			&& !isObject(request.authenticationData))
			throw new APIError('authenticationData must be an Object', APIError.codes.INVALID_AUTHENTICATION_DATA);
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

		await this.setSession();

		await this.validate();

		await this.process();

		this.api.executionTime = process.hrtime(this.executionStarted)[1] / 1000000;

		await LogHelper.save(this.api);

		return this.response();
	}

	prepare() {

		try {

			this.api = this.fetcher.apiController;
			this.api.endpoint = this.endpoint;
			this.api.httpMethod = this.method;
			this.api.data = this.data;
			this.api.pathParameters = this.fetcher.pathParameters;
			this.api.headers = this.headers;
			this.api.cookies = this.cookies;
			this.api.logId = LogHelper.generateId();

		} catch(err) {

			this.api = new API(); // para poder setear error y code correctamente

			/**
			 * Errores posibiles:
			 * 	1. no encuentra el archivo en api/path/file.js
			 * 	2. el archivo no exporta una clase
			 */
			this.setResponseError(err.message, err.code === APIError.codes.API_NOT_FOUND ? 404 : 500);
		}
	}

	async setSession() {

		if(this.hasError)
			return;

		this.api.session = new ApiSession(this.authenticationData);
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
			const message = err.message || 'Invalid data';

			this.setResponseError(message, code, err.messageVariables);
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

			if(!this.api.response.code)
				this.api.setCode(200);

		} catch(err) {

			const code = 500;
			const message = err.message || 'Internal server error';

			this.setResponseError(message, code, err.messageVariables);
		}
	}

	setResponseError(message, httpCode, messageVariables) {
		this.hasError = true;

		if(!this.api.response.code)
			this.api.setCode(httpCode);

		this.api
			.setBody({
				message,
				...(messageVariables ? { messageVariables } : {})
			});
	}

	response() {
		return this.api.response;
	}
};
