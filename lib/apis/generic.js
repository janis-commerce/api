'use strict';

/**
 * @class API
 * @template RequestData
 * @template PathParameters
 */
module.exports = class API {

	/**
	 * @private
	 * @type {import('../types/request').APIRequest<RequestData, PathParameters>}
	 */
	// @ts-expect-error TS2564
	_request;

	/**
	 * @private
	 * @type {import('../types/response').APIResponse}
	 */
	_response = {
		code: undefined,
		body: undefined,
		headers: {},
		cookies: undefined
	};

	/**
	 * @private
	 * @type {number|undefined}
	 */
	_executionTime = undefined;

	/**
	 * @returns {boolean}
	 */
	get shouldCreateLog() {
		return this.request.httpMethod !== 'get';
	}

	/**
	 * @returns {boolean}
	 */
	get shouldLogRequestData() {
		return true;
	}

	/**
	 * @returns {string[]|null}
	 */
	get excludeFieldsLogRequestData() {
		return null;
	}

	/**
	 * @returns {string[]|null}
	 */
	get excludeFieldsLogResponseBody() {
		return null;
	}

	/**
	 * @returns {boolean}
	 */
	get shouldLogRequestHeaders() {
		return true;
	}

	/**
	 * @returns {boolean}
	 */
	get shouldLogResponseBody() {
		return true;
	}

	/**
	 * @param {number} executionTime
	 */
	set executionTime(executionTime) {
		this._executionTime = executionTime;
	}

	/**
	 * @returns {number|undefined}
	 */
	get executionTime() {
		return this._executionTime;
	}

	/**
	 * @returns {import('../types/request').LowerCaseRequestMethod}
	 */
	get httpMethod() {
		return this._request.httpMethod;
	}

	/**
	 * @returns {string}
	 */
	get endpoint() {
		return this._request.endpoint;
	}

	/**
	 * @param {import('../types/request').APIRequest<RequestData, PathParameters>} request
	 */
	set request(request) {
		this._request = request;
	}

	/**
	 * @returns {import('../types/request').APIRequest<RequestData, PathParameters>}
	 */
	get request() {
		return this._request;
	}

	/**
	 * @returns {RequestData}
	 */
	get data() {
		return this._request.data;
	}

	/**
	 * @returns {string}
	 */
	get rawData() {
		return this._request.rawData;
	}

	/**
	 * @returns {string[]}
	 */
	get pathParameters() {
		return this._request.pathParameters;
	}

	/**
	 * @returns {{ [key in PathParameters[number]]: string }}
	 */
	get rawPathParameters() {
		return this._request.rawPathParameters;
	}

	/**
	 * @returns {Record<Lowercase<string>, string>}
	 */
	get headers() {
		return this._request.headers;
	}

	/**
	 * @returns {import('../types/request').Cookies}
	 */
	get cookies() {
		return this._request.cookies;
	}

	/**
	 * @returns {string}
	 */
	get logId() {
		return this._request.logId;
	}

	/**
	 * @returns {import('@janiscommerce/api-session').ApiSession}
	 */
	get session() {
		return this._request.session;
	}

	/**
	 * @returns {import('../types/response').APIResponse}
	 */
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
	 * @returns {this}
	 */
	setHeader(headerName, headerValue) {
		this._response.headers[headerName] = headerValue;
		return this;
	}

	/**
	 * @param {Record<string, string>} headers
	 * @returns {this}
	 */
	setHeaders(headers) {
		this._response.headers = { ...this._response.headers, ...headers };
		return this;
	}

	/**
	 * @param {string} cookieName
	 * @param {string|import('../types/response').ResponseCookieWithOptions} cookieValue
	 * @returns {this}
	 */
	setCookie(cookieName, cookieValue) {
		this._response.cookies ??= {};
		this._response.cookies[cookieName] = cookieValue;
		return this;
	}

	/**
	 * @param {Record<string, string|import('../types/response').ResponseCookieWithOptions>} cookies
	 * @returns {this}
	 */
	setCookies(cookies) {
		this._response.cookies = { ...this._response.cookies, ...cookies };
		return this;
	}

	/**
	 * @param {any} body
	 * @returns {this}
	 */
	setBody(body) {
		this._response.body = body;
		return this;
	}

	/**
	 * @deprecated Use `dataSchema` instead
	 * @returns {object|Function|null}
	 */
	get struct() {
		return null;
	}

	/**
	 * @returns {import('fastest-validator').ValidationSchema<RequestData>|null}
	 */
	get dataSchema() {
		return null;
	}

	/**
	 * @returns {Promise<void>}
	 */
	async validate() {
		// eslint-disable-next-line no-useless-return
		return;
	}

	/**
	 * @returns {Promise<void>}
	 */
	async process() {
		throw new Error('Missing implementation for API.process');
	}

};
