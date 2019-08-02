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

			// apiValue could be the headers, cookies or data
			const apiValue = this.getApiValue(api, identifier);

			if(typeof apiValue !== 'object' || Object.keys(apiValue).length === 0)
				continue;

			// identifierField is the name of the field of header/coookie/data
			const identifierField = this.getIdentifierField(identifier).toLowerCase();

			if(!apiValue[identifierField])
				continue; // not found client identifier in api data

			({ clientField } = identifier);
			fieldValue = apiValue[identifierField];

			break; // if client identifier found break!
		}

		return { clientField, fieldValue };
	}

	static isValidIdentifier(identifier) {
		return (identifier.header || identifier.data || identifier.cookie)
			&& identifier.clientField;
	}

	static getIdentifierField(identifier) {
		return identifier.header || identifier.data || identifier.cookie;
	}

	static getApiValue(api, identifier) {

		let apiValue = {};

		if(identifier.header)
			apiValue = api.headers;
		else if(identifier.data)
			apiValue = api.data;
		else
			apiValue = api.cookies;

		const preparedApiValue = {};

		Object.entries(apiValue).forEach(([key, value]) => {
			preparedApiValue[key.toLowerCase()] = value;
		});

		return preparedApiValue;
	}
}

module.exports = Client;
