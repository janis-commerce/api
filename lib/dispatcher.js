'use strict';

const { struct } = require('superstruct');
const { ApiSession } = require('@janiscommerce/api-session');

const Log = require('@janiscommerce/log');

const Fetcher = require('./fetcher');
const { omitRecursive } = require('./utils');

const API = require('./api');
const APIError = require('./error');

class Dispatcher {

	constructor(request) {
		this._validateRequest(request);

		this.endpoint = request.endpoint.replace(/^\/?(api\/)?/i, '');
		this.method = (request.method || 'get').toLowerCase();
		this.data = request.data || {};
		this.headers = request.headers || {};
		this.cookies = request.cookies || {};
		this.authenticationData = request.authenticationData || {};
		this._executionStarted = process.hrtime();
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
	 * Validates the request
	 *
	 * @param {any} request The request data
	 */
	_validateRequest(request) {

		if(!this._isObject(request))
			throw new APIError('request data must be an Object', APIError.codes.INVALID_REQUEST_DATA);

		if(typeof request.endpoint !== 'string')
			throw new APIError('endpoint must be an String', APIError.codes.INVALID_ENDPOINT);

		if(typeof request.method !== 'undefined'
			&& typeof request.method !== 'string')
			throw new APIError('method must be an String', APIError.codes.INVALID_METHOD);

		if(typeof request.headers !== 'undefined'
			&& !this._isObject(request.headers))
			throw new APIError('headers must be an Object', APIError.codes.INVALID_HEADERS);

		if(typeof request.cookies !== 'undefined'
			&& !this._isObject(request.cookies))
			throw new APIError('cookies must be an Object', APIError.codes.INVALID_COOKIES);

		if(typeof request.authenticationData !== 'undefined'
			&& !this._isObject(request.authenticationData))
			throw new APIError('authenticationData must be an Object', APIError.codes.INVALID_AUTHENTICATION_DATA);
	}

	_saveLog() {

		// Set default in case of shouldCreateLog is not defined
		if(typeof this.shouldCreateLog === 'undefined')
			this.shouldCreateLog = this.endpoint !== 'get';

		if(!this._isObject(this.session) || typeof this.session.clientCode !== 'string' || !this.shouldCreateLog)
			return;

		const executionTime = this._executionFinished[1] / 1000000;
		const response = this.response();
		const entityId = this.endpoint.split('/')[0];

		const log = {
			api: {
				endpoint: this.endpoint,
				httpMethod: this.method
			},
			request: {

				...this.api.shouldLogRequestHeaders ?
					{ headers: omitRecursive(this.headers, ['janis-api-key', 'janis-api-secret']) } : {},

				...this.api.shouldLogRequestData ?
					{ data: this.api.excludeFieldsLogRequestData ? omitRecursive(this.data, this.api.excludeFieldsLogRequestData) : this.data } : {}
			},
			response: {

				code: response.code,
				headers: response.headers,

				...this.api.shouldLogResponseBody ?
					{ body: this.api.excludeFieldsLogResponseBody ? omitRecursive(response.body, this.api.excludeFieldsLogResponseBody) : response.body } : {}
			},
			executionTime
		};

		Log.add(this.session.clientCode, {
			entity: 'api',
			entityId,
			type: 'api-request',
			log
		});
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

		this._executionFinished = process.hrtime(this._executionStarted);

		this._saveLog();

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
			const message = err.message || 'Internal server error';

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
