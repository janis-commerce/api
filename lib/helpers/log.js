'use strict';

const crypto = require('crypto');
const Log = require('@janiscommerce/log');

const { omitRecursive } = require('../utils');

module.exports = class LogHelper {

	static get type() {
		return 'api-request';
	}

	/**
	 * @param {import('../api')} api
	 */
	static save(api, pristineData) {

		if(!this.shouldCreateLog(api))
			return;

		const {
			headers, endpoint, httpMethod, executionTime, response
		} = api;

		const entity = endpoint.split('/')[0];
		const entityId = endpoint.split('/')[1] || response?.body?.id;

		const log = {
			executionTime,
			api: { endpoint, httpMethod },
			request: {
				...api.shouldLogRequestHeaders && { headers: omitRecursive(headers, ['janis-api-key', 'janis-api-secret']) },
				...api.shouldLogRequestData && { data: omitRecursive(pristineData, api.excludeFieldsLogRequestData || []) },
				...this.addServiceName(headers)
			},
			response: {
				code: response.code,
				headers: response.headers,
				...api.shouldLogResponseBody && { body: omitRecursive(response.body, api.excludeFieldsLogResponseBody || []) }
			}
		};

		const logToSave = {
			id: api.logId,
			entity,
			...entityId && { entityId },
			type: this.type,
			message: this.formatRequestMessage(api),
			...api.session?.userId && { userCreated: api.session.userId },
			log
		};

		const isCore = api.shouldLogAsCore || !api.session?.clientCode;

		return isCore
			? Log.addCore(logToSave)
			: Log.add(api.session.clientCode, logToSave);
	}

	static addServiceName({ 'janis-api-key': apiKey }) {

		const serviceApiKeyPrefix = 'service-';

		return {
			...apiKey?.startsWith(serviceApiKeyPrefix) && { 'janis-service-name': apiKey.split(serviceApiKeyPrefix)[1] }
		};
	}

	static formatRequestMessage({ httpMethod, endpoint, response }) {
		return `${httpMethod.toUpperCase()} /api/${endpoint} (${response.code})`;
	}

	static shouldCreateLog(api) {

		// Set default in case of shouldCreateLog is not defined
		if(typeof api.shouldCreateLog === 'undefined')
			api.shouldCreateLog = api.httpMethod !== 'get';

		// Session is optional (client-less requests are logged as core), but a request that never reached
		// prepare() successfully (e.g. API controller not found) has no endpoint at all: nothing valid to log
		return typeof api.endpoint === 'string' && api.shouldCreateLog;
	}

	static generateId() {
		return crypto.randomUUID();
	}

};
