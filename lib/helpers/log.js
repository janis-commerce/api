'use strict';

const Log = require('@janiscommerce/log');

const { v4: uuid } = require('uuid');

const { omitRecursive, isObject } = require('./../utils');

module.exports = class LogHelper {

	static get entity() {
		return 'api';
	}

	static get type() {
		return 'api-request';
	}

	/**
	 * @param {import('../api')} api
	 */
	static save(api) {

		if(!this.shouldCreateLog(api))
			return;

		const {
			headers, data, endpoint, httpMethod, executionTime, response
		} = api;

		const entityId = endpoint.split('/')[0];

		const log = {
			api: { endpoint, httpMethod },
			request: {
				...api.shouldLogRequestHeaders && { headers: omitRecursive(headers, ['janis-api-key', 'janis-api-secret']) },
				...api.shouldLogRequestData && { data: omitRecursive(data, api.excludeFieldsLogRequestData) }
			},
			response: {
				code: response.code,
				headers: response.headers,
				...api.shouldLogResponseBody && { body: omitRecursive(response.body, api.excludeFieldsLogResponseBody) }
			},
			executionTime
		};

		return Log.add(api.session.clientCode, {
			id: api.logId,
			entity: this.entity,
			entityId,
			type: this.type,
			...api.session.userId && { userCreated: api.session.userId },
			log
		});
	}

	static shouldCreateLog(api) {

		// Set default in case of shouldCreateLog is not defined
		if(typeof api.shouldCreateLog === 'undefined')
			api.shouldCreateLog = api.httpMethod !== 'get';

		return isObject(api.session) && typeof api.session.clientCode === 'string' && api.shouldCreateLog;
	}

	static generateId() {
		return uuid();
	}

};
