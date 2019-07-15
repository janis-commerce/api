'use strict';

const assert = require('assert');

const API = require('./../lib/api');

/* eslint-disable prefer-arrow-callback */

describe('API - getInstance helper', function() {

	class MyApi extends API {}
	const myApi = new MyApi();

	class moduleClass {}

	afterEach(() => {
		myApi.client = undefined;
	});

	context('when getting a moduleClass instance', function() {

		it('should inject client if api has a client', function() {

			myApi.client = {
				id: 92,
				name: 'foo',
				active: true
			};

			const moduleInstance = myApi.getInstance(moduleClass);

			assert.deepEqual(moduleInstance.client, myApi.client);
		});

		it('shouldn\'t inject client if api hasn\'t a client', function() {

			const moduleInstance = myApi.getInstance(moduleClass);

			assert.deepEqual(moduleInstance.client, undefined);
		});

	});

});
