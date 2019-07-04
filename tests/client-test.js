'use strict';

const assert = require('assert');

const path = require('path');

const sandbox = require('sinon').createSandbox();

const mockRequire = require('mock-require');

const ActiveClient = require('@janiscommerce/active-client');
const Settings = require('@janiscommerce/settings');

const { API, Dispatcher } = require('./..');
const { Fetcher, Client } = require('./../lib');

/* eslint-disable prefer-arrow-callback */

describe('Client', function() {

	const clientField = 'name';
	const clientFieldValue = 'the-client-name';

	const theClient = {
		id: 6,
		[clientField]: clientFieldValue
	};

	let apiClientSetted;

	const mockIdentifiers = config => {
		sandbox.stub(Settings, 'get')
			.returns({ clientIdentifiers: config });
	};

	const endpoint = 'valid-endpoint/list';

	class ValidAPI extends API {
		async process() {
			apiClientSetted = this.client;
		}
	}

	beforeEach(() => {
		apiClientSetted = null;
		mockRequire(path.join(Fetcher.apiPath, endpoint), ValidAPI);
	});

	afterEach(() => {
		mockRequire.stopAll();
		sandbox.restore();

		// for cache cleaning
		delete Client._identifiers; // eslint-disable-line
	});

	const assertNoClientSet = () => {
		assert.equal(apiClientSetted, undefined);
	};

	const assertClientSet = () => {
		assert.deepEqual(apiClientSetted, theClient);
	};

	const assertSettingsCall = () => {
		sandbox.assert.calledOnce(Settings.get);
		sandbox.assert.calledWithExactly(Settings.get, 'api');
	};

	const identifierApiFields = {
		header: 'headers',
		data: 'data',
		cookie: 'cookies'
	};

	context('when no client config identifier found at all', function() {
		it('shouldn\'t set client', async function() {

			sandbox.stub(Settings, 'get')
				.returns(undefined);

			const myApi = new Dispatcher({
				endpoint: 'api/valid-endpoint'
			});

			await myApi.dispatch();
			await myApi.dispatch();

			assertNoClientSet();
			assertSettingsCall();
		});
	});

	context('when bad client config identifier found', function() {

		it('shouldn\'t set client if no \'header\', \'data\' or \'cookie\' configured in identifier', async function() {

			mockIdentifiers({
				clientField
			});

			const myApi = new Dispatcher({
				endpoint: 'api/valid-endpoint'
			});

			await myApi.dispatch();
			await myApi.dispatch();

			assertNoClientSet();
			assertSettingsCall();
		});

		Object.keys(identifierApiFields).forEach(identifierFieldType => {
			it(`shouldn't set client if '${identifierFieldType}' is configured in identifier, but clientField not found`, async function() {

				mockIdentifiers({
					[identifierFieldType]: 'foo'
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint'
				});

				await myApi.dispatch();
				await myApi.dispatch();

				assertNoClientSet();
				assertSettingsCall();
			});
		});
	});

	context('when valid client config identifier found', function() {

		Object.entries(identifierApiFields).forEach(([identifierFieldType, identifierApiField]) => {

			it(`shouldn't set client if no ${identifierFieldType} received`, async function() {

				mockIdentifiers({
					[identifierFieldType]: 'client',
					clientField
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint'
				});

				sandbox.stub(ActiveClient, 'getByField');

				await myApi.dispatch();
				await myApi.dispatch();

				assertNoClientSet();
				assertSettingsCall();

				sandbox.assert.notCalled(ActiveClient.getByField);
			});

			it(`shouldn't set client if empty ${identifierFieldType} received`, async function() {

				mockIdentifiers({
					[identifierFieldType]: 'client',
					clientField
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint',
					[identifierApiField]: {}
				});

				sandbox.stub(ActiveClient, 'getByField');

				await myApi.dispatch();
				await myApi.dispatch();

				assertNoClientSet();
				assertSettingsCall();

				sandbox.assert.notCalled(ActiveClient.getByField);
			});

			it(`shouldn't set client if no expected ${identifierFieldType} received`, async function() {

				mockIdentifiers({
					[identifierFieldType]: 'client',
					clientField
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint',
					[identifierApiField]: {
						[`other-${identifierFieldType}`]: clientFieldValue
					}
				});

				sandbox.stub(ActiveClient, 'getByField');

				await myApi.dispatch();
				await myApi.dispatch();

				assertNoClientSet();
				assertSettingsCall();

				sandbox.assert.notCalled(ActiveClient.getByField);
			});

			it(`shouldn't set client if ${identifierFieldType} received but no client found by ActiveClient module`, async function() {

				mockIdentifiers({
					[identifierFieldType]: 'client',
					clientField
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint',
					[identifierApiField]: {
						client: clientFieldValue
					}
				});

				sandbox.stub(ActiveClient, 'getByField')
					.returns([]);

				await myApi.dispatch();
				await myApi.dispatch();

				assertNoClientSet();
				assertSettingsCall();

				sandbox.assert.calledTwice(ActiveClient.getByField);
				sandbox.assert.calledWithExactly(ActiveClient.getByField, clientField, clientFieldValue);
			});

			it(`should set client if ${identifierFieldType} received and client found by ActiveClient module`, async function() {

				mockIdentifiers({
					[identifierFieldType]: 'client',
					clientField
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint',
					[identifierApiField]: {
						client: clientFieldValue
					}
				});

				sandbox.stub(ActiveClient, 'getByField')
					.returns(theClient);

				await myApi.dispatch();
				await myApi.dispatch();

				assertClientSet();
				assertSettingsCall();

				sandbox.assert.calledTwice(ActiveClient.getByField);
				sandbox.assert.calledWithExactly(ActiveClient.getByField, clientField, clientFieldValue);
			});

		});

		it('should set client if header received and client found by ActiveClient module with multiple identifiers', async function() {

			mockIdentifiers([{
				header: 'client-id',
				clientField: 'id'
			}, {
				header: 'client',
				clientField
			}]);

			const myApi = new Dispatcher({
				endpoint: 'api/valid-endpoint',
				headers: {
					client: clientFieldValue
				}
			});

			sandbox.stub(ActiveClient, 'getByField')
				.returns(theClient);

			await myApi.dispatch();
			await myApi.dispatch();

			assertClientSet();
			assertSettingsCall();

			sandbox.assert.calledTwice(ActiveClient.getByField);
			sandbox.assert.calledWithExactly(ActiveClient.getByField, clientField, clientFieldValue);
		});

	});

});
