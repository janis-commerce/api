'use strict';

const assert = require('assert');

const sandbox = require('sinon').createSandbox();

const mockRequire = require('mock-require');

const API = require('./../lib/api');
const Controller = require('./../lib/controller');

/* eslint-disable prefer-arrow-callback */

describe('API - Controller helpers', function() {

	class MyApi extends API {}
	const myApi = new MyApi();

	const FakeControllerModule = { getInstance: () => {} };

	afterEach(() => {
		myApi.client = undefined;
		sandbox.restore();
	});

	it('should throw if no @janiscommerce/model-controller package installed', function() {

		sandbox.stub(Controller, 'moduleFilePath')
			.get(() => 'model-controller-fake');

		assert.throws(() => myApi.getController('foo-controller'));
	});

	it('should throw an Error when Controller not found the controller', function() {

		sandbox.stub(FakeControllerModule, 'getInstance')
			.throws(new Error('invalid controller'));

		mockRequire(Controller.moduleFilePath, { Controller: FakeControllerModule });

		assert.throws(() => myApi.getController('foo-controller'));

		sandbox.assert.calledOnce(FakeControllerModule.getInstance);
		sandbox.assert.calledWithExactly(FakeControllerModule.getInstance, 'foo-controller');
	});

	context('when Controller module found the controller', function() {
		it('should return controller without client if client', function() {

			sandbox.stub(FakeControllerModule, 'getInstance')
				.returns({ foo: 'bar' });

			mockRequire(Controller.moduleFilePath, { Controller: FakeControllerModule });

			const fooController = myApi.getController('foo-controller');

			assert.deepEqual(fooController, { foo: 'bar' });

			sandbox.assert.calledOnce(FakeControllerModule.getInstance);
			sandbox.assert.calledWithExactly(FakeControllerModule.getInstance, 'foo-controller');

			const againFooController = myApi.getController('foo-controller');

			assert.deepEqual(againFooController, { foo: 'bar' });

			sandbox.assert.calledTwice(FakeControllerModule.getInstance);
			sandbox.assert.alwaysCalledWith(FakeControllerModule.getInstance, 'foo-controller');
		});

		it('should return controller with client if client present in api', function() {

			myApi.client = {
				id: 8348,
				name: 'client-name'
			};

			sandbox.stub(FakeControllerModule, 'getInstance')
				.returns({ foo: 'bar' });

			mockRequire(Controller.moduleFilePath, { Controller: FakeControllerModule });

			const fooController = myApi.getController('foo-controller');

			assert.deepEqual(fooController, { foo: 'bar', client: myApi.client });

			sandbox.assert.calledOnce(FakeControllerModule.getInstance);
			sandbox.assert.calledWithExactly(FakeControllerModule.getInstance, 'foo-controller');

			const againFooController = myApi.getController('foo-controller');

			assert.deepEqual(againFooController, { foo: 'bar', client: myApi.client });

			sandbox.assert.calledTwice(FakeControllerModule.getInstance);
			sandbox.assert.alwaysCalledWith(FakeControllerModule.getInstance, 'foo-controller');
		});
	});

});
