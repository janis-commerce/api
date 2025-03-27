'use strict';

const { stringify, parse } = require('qs');

const { ApiSession } = require('@janiscommerce/api-session');

const { trimObjectValues } = require('../utils');

module.exports = class RequestParser {

	/**
	 *
	 * @param {import('../types/request').RawRequestEvent} event
	 * @param {string} logId
	 * @returns {import('../types/request').APIRequest<unknown>}
	 */
	static parse(event, logId) {

		/** @type {import('../types/request').LowerCaseRequestMethod} */
		// @ts-expect-error TS2332
		const httpMethod = event.method.toLowerCase();

		let data = {};
		if(httpMethod === 'get') {
			const queryString = stringify(event.query);

			if(queryString)
				data = parse(queryString, { arrayLimit: 1000, allowSparse: true });

		} else if(event.body)
			data = event.body;

		const headers = Object.entries(event.headers).reduce((/** @type {import('../types/request').LowerCaseHeaders} */accum, [key, value]) => {
			accum[key.toLowerCase()] = value;
			return accum;
		}, {});

		const authenticationData = (event.authorizer?.janisAuth && JSON.parse(event.authorizer.janisAuth)) || {};

		const endpoint = Object.entries(event.path).reduce((accum, [key, value]) => {
			accum = accum.replace(`{${key}}`, value);
			return accum;
		}, event.requestPath.replace(/^\//, ''));

		return {
			// @ts-expect-error TS2554
			session: new ApiSession(authenticationData),
			logId,
			httpMethod,
			endpoint,
			data: trimObjectValues(data),
			rawData: event.rawBody,
			pristineData: Object.freeze(JSON.parse(JSON.stringify(data))),
			pathParameters: Object.values(event.path),
			rawPathParameters: event.path,
			headers,
			cookies: this.parseCookies(headers.cookie)
		};
	}

	/**
	 * @private
	 * @param {string} cookiesString
	 * @returns {import('../types/request').Cookies}
	 */
	static parseCookies(cookiesString) {

		if(!cookiesString)
			return {};

		/** @type {import('../types/request').Cookies} */
		const cookies = {};

		cookiesString.split(';').forEach(cookie => {
			const [cookieName, ...cookieValueArray] = cookie.split('=');
			cookies[cookieName.trim()] = decodeURI(cookieValueArray.join('='));
		});

		return cookies;
	}
};
