'use strict';

const ActiveClient = require('@janiscommerce/active-client');
const Settings = require('@janiscommerce/settings');

class Client {

	static get identifiers() {

		if(typeof this._identifiers === 'undefined') {

			const apiSettings = Settings.get('api') || {};
			let clientIdentifiers = apiSettings.clientIdentifiers || [];

			if(!Array.isArray(clientIdentifiers))
				clientIdentifiers = [clientIdentifiers];

			this._identifiers = clientIdentifiers;
		}

		return this._identifiers;
	}

	static async setActive(api) {

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

		for(const identifier of this.identifiers) {

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
