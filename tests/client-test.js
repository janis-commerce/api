'use strict';

const assert = require('assert');

const path = require('path');

const sandbox = require('sinon').createSandbox();

const mockRequire = require('mock-require');

const ActiveClient = require('@janiscommerce/active-client');

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

	const mockIdentifiers = config => mockRequire(Client.identifierFilePath, config);

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
		delete Client._identifier; // eslint-disable-line
	});

	// para espiar al setter identifierFilePath()...
	const getSpyIdentifierFilePathGetter = () => sandbox.spy(Client, 'identifierFilePath', ['get']);

	const assertNoClientSet = () => {
		assert.equal(apiClientSetted, undefined);
	};

	const assertClientSet = () => {
		assert.deepEqual(apiClientSetted, theClient);
	};

	const identifierApiFields = {
		header: 'headers',
		data: 'data',
		cookie: 'cookies'
	};

	context('when no client config identifier found at all', function() {
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

	context('when bad client config identifier found', function() {

		it('shouldn\'t set client if no \'header\', \'data\' or \'cookie\' configured in identifier', async function() {
			mockIdentifiers({
				clientField
			});

			const myApi = new Dispatcher({
				endpoint: 'api/valid-endpoint'
			});

			assertNoClientSet();

			await myApi.dispatch();
		});

		Object.keys(identifierApiFields).forEach(identifierFieldType => {
			it(`shouldn't set client if '${identifierFieldType}' is configured in identifier, but clientField not found`, async function() {

				mockIdentifiers({
					[identifierFieldType]: 'foo'
				});

				const myApi = new Dispatcher({
					endpoint: 'api/valid-endpoint'
				});

				assertNoClientSet();

				await myApi.dispatch();
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

				const stubGetByField = sandbox.stub(ActiveClient, 'getByField');

				assertNoClientSet();

				await myApi.dispatch();

				assert(stubGetByField.notCalled);
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

				const stubGetByField = sandbox.stub(ActiveClient, 'getByField');

				assertNoClientSet();

				await myApi.dispatch();

				assert(stubGetByField.notCalled);
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

				const stubGetByField = sandbox.stub(ActiveClient, 'getByField');

				assertNoClientSet();

				await myApi.dispatch();

				assert(stubGetByField.notCalled);
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

				const stubGetByField = sandbox.stub(ActiveClient, 'getByField')
					.returns([]);

				assertNoClientSet();

				await myApi.dispatch();

				assert(stubGetByField.calledOnceWithExactly(clientField, clientFieldValue));
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

				const stubGetByField = sandbox.stub(ActiveClient, 'getByField')
					.returns(theClient);

				await myApi.dispatch();

				assertClientSet();

				assert(stubGetByField.calledOnceWithExactly(clientField, clientFieldValue));
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

			const stubGetByField = sandbox.stub(ActiveClient, 'getByField')
				.returns(theClient);

			await myApi.dispatch();

			assertClientSet();

			assert(stubGetByField.calledOnceWithExactly(clientField, clientFieldValue));
		});

	});

});
