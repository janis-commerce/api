'use strict';

// Require para poder tipar el getter/setter de session
// eslint-disable-next-line no-unused-vars
const { ApiSession } = require('@janiscommerce/api-session');

/**
 * @typedef {Object} Request
 * @property {*} data
 * @property {string} httpMethod
 * @property {string} endpoint
 * @property {Array<string>} pathParameters
 * @property {Object<string, string>} headers
 * @property {Object<string, string>} cookies
 * @property {string} logId
 */

/**
 * @typedef {Object} Response
 * @property {*} body
 * @property {number} code
 * @property {Object<string, string>} headers
 * @property {Object<string, string>} cookies
 */

module.exports = class API {

	constructor() {
		/**
		 * @private
		 * @type Request
		 */
		this._request = {};

		/**
		 * @private
		 * @type Response
		 */
		this._response = {
			code: undefined,
			body: undefined,
			headers: {},
			cookies: {}
		};

		/**
		 * @private
		 * @type number
		 */
		this._executionTime = undefined;

		/**
		 * @private
		 * @type ApiSession
		 */
		this._session = undefined;
	}

	/**
	 * @return {boolean}
	 */
	get shouldLogRequestData() {
		return true;
	}

	/**
	 * @return {boolean}
	 */
	get shouldLogRequestHeaders() {
		return true;
	}

	/**
	 * @return {boolean}
	 */
	get shouldLogResponseBody() {
		return true;
	}

	set executionTime(executionTime) {
		this._executionTime = executionTime;
	}

	get executionTime() {
		return this._executionTime;
	}

	set httpMethod(httpMethod) {
		this._request.httpMethod = httpMethod;
	}

	get httpMethod() {
		return this._request.httpMethod;
	}

	set endpoint(endpoint) {
		this._request.endpoint = endpoint;
	}

	get endpoint() {
		return this._request.endpoint;
	}

	set data(data) {
		this._request.data = data;
	}

	get data() {
		return this._request.data;
	}

	set pathParameters(pathParameters) {
		this._request.pathParameters = pathParameters;
	}

	get pathParameters() {
		return this._request.pathParameters;
	}

	set headers(headers) {
		this._request.headers = headers;
	}

	get headers() {
		return this._request.headers;
	}

	set cookies(cookies) {
		this._request.cookies = cookies;
	}

	get cookies() {
		return this._request.cookies;
	}

	set logId(logId) {
		this._request.logId = logId;
	}

	get logId() {
		return this._request.logId;
	}

	set session(session) {
		this._session = session;
	}

	get session() {
		return this._session;
	}

	get response() {
		return this._response;
	}

	/**
	 * @param {number} code
	 */
	setCode(code) {
		this._response.code = code;
		return this;
	}

	/**
	 * @param {string} headerName
	 * @param {string} headerValue
	 */
	setHeader(headerName, headerValue) {
		this._response.headers[headerName] = headerValue;
		return this;
	}

	/**
	 * @param {Object<string, string>} headers
	 */
	setHeaders(headers) {
		this._response.headers = { ...this._response.headers, ...headers };
		return this;
	}

	/**
	 * @param {string} cookieName
	 * @param {string} cookieValue
	 */
	setCookie(cookieName, cookieValue) {
		this._response.cookies[cookieName] = cookieValue;
		return this;
	}

	/**
	 * @param {Object<string, string>} cookies
	 */
	setCookies(cookies) {
		this._response.cookies = { ...this._response.cookies, ...cookies };
		return this;
	}

	/**
	 * @param {*} body
	 */
	setBody(body) {
		this._response.body = body;
		return this;
	}

	/**
	 * @return {Object|function|null}
	 */
	get struct() {
		return null;
	}

	/**
	 * @return {Promise<void>}
	 */
	async validate() {
		// eslint-disable-next-line no-useless-return
		return;
	}

	/**
	 * @return {Promise<void>}
	 */
	async process() {
		throw new Error('Missing implementation for API.process');
	}

};
