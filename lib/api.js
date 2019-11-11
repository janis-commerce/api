'use strict';

class API {

	constructor() {
		this._request = {};

		this._response = {
			code: undefined,
			body: undefined,
			headers: {},
			cookies: {}
		};
	}

	// Setters and getters

	get shouldLogRequestData() {
		return true;
	}

	get shouldLogRequestHeaders() {
		return true;
	}

	get shouldLogResponseBody() {
		return true;
	}

	// Request setters and getters

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

	set session(session) {
		this._session = session;
	}

	get session() {
		return this._session;
	}

	// Response methods

	get response() {
		return this._response;
	}

	setCode(code) {
		this._response.code = code;
		return this;
	}

	setHeader(headerName, headerValue) {
		this._response.headers[headerName] = headerValue;
		return this;
	}

	setHeaders(headers) {
		this._response.headers = { ...this._response.headers, ...headers };
		return this;
	}

	setCookie(cookieName, cookieValue) {
		this._response.cookies[cookieName] = cookieValue;
		return this;
	}

	setCookies(cookies) {
		this._response.cookies = { ...this._response.cookies, ...cookies };
		return this;
	}

	setBody(body) {
		this._response.body = body;
		return this;
	}

}

module.exports = API;
