'use strict';

const assert = require('assert');

const path = require('path');

const sandbox = require('sinon').createSandbox();

const mockRequire = require('mock-require');

const ActiveClient = require('@janiscommerce/active-client');

const { API, Dispatcher } = require('./..');
const { Fetcher, Client } = require('./../lib');

/* eslint-disable prefer-arrow-callback */

describe.only('Client API', function() {

	const mockIdentifiers = config => mockRequire(Client.identifierFilePath, config);

	const endpoint = 'valid-endpoint/list';

	let myCallback = () => {};

	class ValidAPI extends API {
		async process() {
			myCallback(this);
		}
	}

	beforeEach(() => {
		myCallback = () => {};
		mockRequire(path.join(Fetcher.apiPath, endpoint), ValidAPI);
	});

	afterEach(() => {
		myCallback = () => {};
		mockRequire.stopAll();
		sandbox.restore();

		// for cache cleaning
		delete Client._identifier; // eslint-disable-line
	});

	// para espiar al setter identifierFilePath()...
	const getSpyIdentifierFilePathGetter = () => sandbox.spy(Client, 'identifierFilePath', ['get']);

	const assertNoClientSet = () => {
		myCallback = api => {
			assert.equal(api.client, undefined);
		};
	};

	const identifierApiFields = {
		header: 'headers',
		data: 'data',
		cookie: 'cookies'
	};

	context('when no client identifier config found', function() {
		it('shouldn\'t set client', async function() {

			const spyIdentifierFilePathGetter = getSpyIdentifierFilePathGetter();

			const myApi = new Dispatcher({
				endpoint: 'api/valid-endpoint'
			});

			assertNoClientSet();

			await myApi.dispatch();

			assert.equal(spyIdentifierFilePathGetter.get.callCount, 1);

			await myApi.dispatch();

			assert.equal(spyIdentifierFilePathGetter.get.callCount, 1); // is 1 for identifier cache
		});
	});

	context('when client identifier config found if bad format', function() {

		it('shouldn\'t set client if no \'header\', \'data\' or \'cookie\' configured in identifier', async function() {
			mockIdentifiers({
				clientField: 'foo'
			});

			const myApi = new Dispatcher({
				endpoint: 'api/valid-endpoint'
			});

			assertNoClientSet();

			await myApi.dispatch();
		});

		Object.keys(identifierApiFields).forEach(apiIdentifierField => {
			it(`shouldn't set client if '${apiIdentifierField}' is configured in identifier, but clientField not found`, async function() {

				mockIdentifiers({
					[apiIdentifierField]: 'foo'
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint'
				});

				assertNoClientSet();

				await myApi.dispatch();
			});
		});

	});

	context('when client identifier valid config found', function() {

		Object.keys(identifierApiFields).forEach(apiIdentifierField => {

			it(`shouldn't set client if no ${apiIdentifierField} received`, async function() {

				mockIdentifiers({
					[apiIdentifierField]: 'client',
					clientField: 'name'
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint'
				});

				assertNoClientSet();

				await myApi.dispatch();
			});
		});

		Object.entries(identifierApiFields).forEach(([identifierField, identifierApiField]) => {

			it(`shouldn't set client if ${identifierField} received but no client found by ActiveClient module`, async function() {

				mockIdentifiers({
					[identifierField]: 'client',
					clientField: 'name'
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint',
					[identifierApiField]: {
						client: 'the-client-name'
					}
				});

				const stubGetByField = sandbox.stub(ActiveClient, 'getByField')
					.returns([]);

				await myApi.dispatch();

				assert(stubGetByField.calledOnceWithExactly('name', 'the-client-name'));
			});

		});

	});

});
