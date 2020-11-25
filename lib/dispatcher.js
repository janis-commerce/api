'use strict';

const { struct } = require('@janiscommerce/superstruct');
const { ApiSession } = require('@janiscommerce/api-session');

const Log = require('@janiscommerce/log');

const { v4: uuid } = require('uuid');

const Fetcher = require('./fetcher');
const { omitRecursive, isObject } = require('./utils');

const API = require('./api');
const APIError = require('./error');

module.exports = class Dispatcher {

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

	_shouldCreateLog() {

		// Set default in case of shouldCreateLog is not defined
		if(typeof this.api.shouldCreateLog === 'undefined')
			this.api.shouldCreateLog = this.method !== 'get';

		return isObject(this.api.session) && typeof this.api.session.clientCode === 'string' && this.api.shouldCreateLog;
	}

	_saveLog() {

		if(!this._shouldCreateLog())
			return;

		const executionTime = this._executionFinished[1] / 1000000;
		const response = this.response();
		const entityId = this.endpoint.split('/')[0];

		const log = {
			api: {
				endpoint: this.endpoint,
				httpMethod: this.method
			},
			request: {},
			response: {
				code: response.code,
				headers: response.headers
			},
			executionTime
		};

		if(this.api.shouldLogRequestHeaders)
			log.request.headers = omitRecursive(this.headers, ['janis-api-key', 'janis-api-secret']);

		if(this.api.shouldLogRequestData)
			log.request.data = omitRecursive(this.data, this.api.excludeFieldsLogRequestData);

		if(this.api.shouldLogResponseBody)
			log.response.body = omitRecursive(response.body, this.api.excludeFieldsLogResponseBody);

		return Log.add(this.api.session.clientCode, {
			id: this.api.logId,
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

		await this._saveLog();

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
			this.api.logId = uuid();

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

		if(!this.api.response.code)
			this.api.setCode(200);

		return this.api.response;
	}
};
