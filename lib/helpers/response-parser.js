'use strict';

// @ts-expect-error TS2741
const logger = require('lllog')();

module.exports = class ResponseParser {

	/**
	 * @param {import('../types/response').APIResponse} response
	 * @param {string} [clientCode]
	 * @returns {import('../types/response').RawResponsePayload}
	 */
	static parse(response, clientCode) {

		this.setCookies(response);

		const apiResponse = {
			...clientCode && { clientCode },
			statusCode: response.code,
			statusCodeForPatternMatching: `[${response.code}]`,
			...response.body && { body: JSON.stringify(response.body) },
			...response.headers && { headers: response.headers }
		};

		if(apiResponse.statusCode >= 400) {
			logger.error(JSON.stringify({
				statusCode: apiResponse.statusCode,
				headers: apiResponse.headers,
				body: apiResponse.body
			}));
		}

		return apiResponse;
	}

	/**
	 * @private
	 * @param {import('../types/response').APIResponse} response
	 */
	static setCookies(response) {

		const cookieHeader = this.formatCookies(response);

		if(cookieHeader)
			response.headers['Set-Cookie'] = cookieHeader;
	}

	/**
	 * @private
	 * @param {import('../types/response').APIResponse} response
	 * @returns {string | undefined}
	 */
	static formatCookies({ cookies }) {

		if(!cookies)
			return;

		const [firstCookie] = Object.entries(cookies);

		if(!firstCookie)
			return;

		const [cookieName, cookieValue] = firstCookie;

		if(typeof cookieValue === 'object') {
			const httpOnly = cookieValue.httpOnly ? '; HttpOnly' : '';
			const secure = cookieValue.secure ? '; Secure' : '';
			const path = cookieValue.path ? `; Path=${cookieValue.path}` : '';
			const expires = cookieValue.expires
				? (`; Expires=${cookieValue.expires.toUTCString()}`)
				: '';
			const domain = cookieValue.domain ? `; Domain=${cookieValue.domain}` : '';

			return `${cookieName}=${cookieValue.value}${httpOnly}${secure}${path}${expires}${domain}`;
		}

		return `${cookieName}=${cookieValue}`;
	}

};
