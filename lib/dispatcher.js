'use strict';

const { struct } = require('@janiscommerce/superstruct');
const { ApiSession } = require('@janiscommerce/api-session');

const Events = require('@janiscommerce/events');

const Fetcher = require('./fetcher');
const { isObject, trimObjValues, cloneObj } = require('./utils');

const API = require('./api');
const APIError = require('./error');

const LogHelper = require('./helpers/log');

/**
 * @typedef {import('@janiscommerce/api-session').ApiSession.AuthenticationData} AuthenticationData
 */

/**
 * @typedef AWSRequest
 * @property {string} endpoint
 * @property {string} method
 * @property {*} data
 * @property {string} rawData
 * @property {Object<string, string>} headers
 * @property {Object<string, string>} cookies
 * @property {?AuthenticationData} authenticationData
 */

module.exports = class Dispatcher {

	/**
	 *
	 * @param {AWSRequest} request
	 */
	constructor(request) {
		this._validateRequest(request);

		const trimData = trimObjValues({ ...request.data });
		const pristineData = cloneObj({ ...request.data });
		this.endpoint = request.endpoint.replace(/^\/?(api\/)?/i, '');
		this.method = (request.method || 'get').toLowerCase();
		this.data = trimData;
		this.pristineData = request.data && pristineData;
		Object.freeze(this.pristineData);
		this.rawData = request.rawData;
		this.headers = request.headers || {};
		this.cookies = request.cookies || {};
		this.authenticationData = request.authenticationData || {};
		this.executionStarted = process.hrtime();
	}

	/**
	 * Validates the request
	 *
	 * @param {AWSRequest} request The request data
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

		let error;

		try {
			this.prepare();

			this.setSession();

			await this.validate();

			await this.process();

		} catch(err) {
			error = err;
		}

		this.api.executionTime = process.hrtime(this.executionStarted)[1] / 1000000;

		Events.emit('janiscommerce.ended');

		await LogHelper.save(this.api, this.pristineData);

		if(error)
			throw error;

		return this.response();
	}

	prepare() {

		try {

			this.api = this.fetcher.apiController;
			this.api.endpoint = this.endpoint;
			this.api.httpMethod = this.method;
			this.api.data = this.data;
			this.api.rawData = this.rawData;
			this.api.pathParameters = this.fetcher.pathParameters;
			this.api.headers = this.headers;
			this.api.cookies = this.cookies;
			this.api.logId = LogHelper.generateId();

			// this variable is used for every Log that the Api will add, see more in @janiscommerce/log
			process.env.JANIS_API_REQUEST_LOG_ID = this.api.logId;

		} catch(err) {

			this.api = new API(); // para poder setear error y code correctamente

			/**
			 * Errores posibiles:
			 * 	1. no encuentra el archivo en api/path/file.js
			 * 	2. el archivo no exporta una clase
			 */
			if(err.code === APIError.codes.API_NOT_FOUND)
				err.statusCode = 404;

			this.setErrorResponse(err, 500, 'Internal error');

			throw err;
		}
	}

	setSession() {
		this.api.session = new ApiSession(this.authenticationData);
	}

	async validate() {

		try {

			// Check data against struct if any
			this._validateStruct();

			// API request validation
			await this.api.validate();

		} catch(err) {

			this.setErrorResponse(err, 400, 'Invalid data');

			throw err;
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

		try {

			// call api controller process
			await this.api.process();

			if(!this.api.response.code)
				this.api.setCode(200);

		} catch(err) {

			this.setErrorResponse(err, 500, 'Internal server error');

			throw err;
		}
	}

	setErrorResponse(error, defaultStatusCode, defaultMessage) {

		const statusCode = error.statusCode || this.api.response.code || defaultStatusCode;
		this.api.setCode(statusCode);
		error.statusCode = statusCode;

		let body = { message: defaultMessage };

		if(error.body)
			({ body } = error);
		else if(!this.api.response.body && error.message) {
			body = {
				message: error.message,
				...(error.messageVariables && { messageVariables: error.messageVariables })
			};
		}

		this.api.setBody(body);
		error.body = body;
	}

	response() {
		return this.api.response;
	}
};
