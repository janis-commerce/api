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

			if(!this.isValidIdentifier(identifier)) {
				// ERROR bad identifier
				continue;
			}

			const identifierValue = this.getIdentifierValue(identifier);

			const apiValue = this.getIdentifierObject(api, identifier);

			if(typeof apiValue !== 'object' || Object.keys(apiValue).length === 0)
				continue;

			if(!apiValue[identifierValue])
				continue; // not found client identifier in api data

			({ clientField } = identifier);
			fieldValue = apiValue[identifierValue];

			break; // if client identifier found break!
		}

		return { clientField, fieldValue };
	}

	static isValidIdentifier(identifier) {
		return (identifier.header || identifier.data || identifier.cookie)
			&& identifier.clientField;
	}

	static getIdentifierValue(identifier) {

		if(identifier.header)
			return identifier.header;

		if(identifier.data)
			return identifier.data;

		return identifier.cookie;
	}

	static getIdentifierObject(api, identifier) {

		if(identifier.header)
			return api.headers;

		if(identifier.data)
			return api.data;

		return api.cookies;
	}
}

module.exports = Client;
