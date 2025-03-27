'use strict';

const nodeCrypto = require('crypto');

const Log = require('@janiscommerce/log');

const { omitRecursive } = require('../utils');

module.exports = class LogHelper {

	static get type() {
		return 'api-request';
	}

	/**
	 * @returns {void}
	 */
	static start() {
		Log.start();
	}

	/**
	 * @param {import('../apis/generic')<unknown>} api
	 */
	static save(api) {

		if(!this.shouldCreateLog(api))
			return;

		const {
			headers, endpoint, httpMethod, executionTime, response
		} = api;

		const entity = endpoint.split('/')[0];
		const entityId = response?.body?.id || endpoint.split('/')[1];

		const log = {
			executionTime,
			api: {
				endpoint: `/${endpoint}`,
				httpMethod
			},
			request: {
				...api.shouldLogRequestHeaders && { headers: omitRecursive(headers, ['janis-api-key', 'janis-api-secret']) },
				...api.shouldLogRequestData && { data: omitRecursive(api.request.pristineData, api.excludeFieldsLogRequestData) },
				...this.addServiceName(headers)
			},
			response: {
				code: response.code,
				headers: response.headers,
				...api.shouldLogResponseBody && { body: omitRecursive(response.body, api.excludeFieldsLogResponseBody) }
			}
		};

		return Log.add(api.session.clientCode, {
			id: api.logId,
			entity,
			...entityId && { entityId },
			type: this.type,
			message: this.formatRequestMessage(api),
			...api.session.userId && { userCreated: api.session.userId },
			log
		});
	}

	/**
	 * @param {import('../types/request').LowerCaseHeaders} requestHeaders
	 */
	static addServiceName({ 'janis-api-key': apiKey }) {

		const serviceApiKeyPrefix = 'service-';

		return {
			...apiKey?.startsWith(serviceApiKeyPrefix) && { 'janis-service-name': apiKey.split(serviceApiKeyPrefix)[1] }
		};
	}

	/**
	 * @param {import('../apis/generic')<unknown>} api
	 */
	static formatRequestMessage(api) {
		const { httpMethod, endpoint, response } = api;
		return `${httpMethod.toUpperCase()} /api/${endpoint} (${response.code})`;
	}

	/**
	 * @param {import('../apis/generic')<unknown>} api
	 */
	static shouldCreateLog(api) {
		return typeof api.session?.clientCode === 'string' && api.shouldCreateLog;
	}

	/**
	 * @returns {string}
	 */
	static generateId() {
		return nodeCrypto.randomUUID();
	}

};
