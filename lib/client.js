'use strict';

const path = require('path');

const ActiveClient = require('@janiscommerce/active-client');

class Client {

	static get identifierFilePath() {
		return path.join(process.cwd(), 'config', 'api.json');
	}

	static get identifier() {

		if(typeof this._identifier === 'undefined') {
			try {
				/* eslint-disable global-require, import/no-dynamic-require */
				this._identifier = require(this.identifierFilePath);
				/* eslint-enable */

				if(!Array.isArray(this._identifier))
					this._identifier = [this._identifier];

			} catch(error) {
				this._identifier = false;
			}
		}

		return this._identifier;
	}

	static async setActive(api) {

		if(!this.identifier)
			return;

		const { clientField, fieldValue } = this.getIdentifierFromApi(api);

		if(!clientField || !fieldValue)
			return;

		const client = await ActiveClient.getByField(clientField, fieldValue);

		if(client && typeof client === 'object' && !Array.isArray(client))
			api.client = client;
	}

	static getIdentifierFromApi(api) {

		let clientField;
		let fieldValue;

		for(const identifier of this.identifier) {

			if(!identifier.clientField) {
				// ERROR bad identifier
				continue;
			}

			const identifierValue = this.getIdentifierValue(identifier);

			if(!identifierValue) {
				// ERROR bad identifier
				continue;
			}

			const apiValue = this.getIdentifierObject(api, identifier);

			if(!apiValue || (typeof apiValue !== 'object' || Array.isArray(apiValue)))
				continue;

			if(!apiValue[identifierValue])
				continue; // not found client identifier in api data

			({ clientField } = identifier);
			fieldValue = apiValue[identifierValue];

			break; // if client identifier found break!
		}

		return { clientField, fieldValue };
	}

	static getIdentifierValue(identifier) {

		if(identifier.header)
			return identifier.header;

		if(identifier.data)
			return identifier.data;

		if(identifier.cookie)
			return identifier.cookie;

		return false;
	}

	static getIdentifierObject(api, identifier) {

		if(identifier.header)
			return api.headers;

		if(identifier.data)
			return api.data;

		if(identifier.cookie)
			return api.cookies;

		return false;
	}
}

module.exports = Client;
