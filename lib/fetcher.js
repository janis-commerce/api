'use strict';

const path = require('path');

const API = require('./api');
const APIError = require('./error');

class Fetcher {

	static get folder() {
		return 'api';
	}

	static get apiPath() {
		const prefix = typeof process.env.MS_PATH === 'string' ? process.env.MS_PATH : '';
		return path.join(process.cwd(), prefix, this.folder);
	}

	constructor(endpoint, method) {
		this.endpoint = endpoint;
		this.method = method.toLocaleLowerCase();
	}


	/**
	 * Make and returns the fileName based on endpoint and http method
	 * @example
	 * this.filePath() // this.endpoint = '/products/10/skus/'; this.method = 'get'
	 * products/skus/get.js
	 */
	get filePath() {

		const urlParts = this.endpoint
			.toLowerCase()
			.split('/');

		// if request a list of resources the method is 'list', otherwise is the method
		const method = (this.method === 'get' && urlParts.length % 2 === 1) ? 'list' : this.method;

		const filePath = urlParts
			.filter((value, index) => index % 2 === 0)
			.join('/');

		return path.join(this.constructor.apiPath, filePath, method);
	}

	/**
	 * @return {Array} Path parameters
	 */
	get pathParameters() {

		return this.endpoint
			.toLowerCase()
			.split('/')
			.filter((value, index) => index % 2 === 1);
	}

	/**
	 * Get a new API REST Controller Instance
	 *
	 * @return {object} The API Rest controller.
	 */
	get apiController() {

		const { filePath } = this;

		let APIController;

		try {

			/* eslint-disable global-require, import/no-dynamic-require */
			APIController = require(filePath);
			/* eslint-enable */

		} catch(e) {
			e.message = `Invalid API Controller ${filePath}: ${e.message}`;
			throw new APIError(e, APIError.codes.API_NOT_FOUND);
		}

		let apiController;

		try {
			apiController = new APIController();
		} catch(e) {
			e.message = `Error initializing '${filePath}': ${e.message}`;
			throw new APIError(e, APIError.codes.INVALID_API);
		}

		// Validate api inheritance
		if(!(apiController instanceof API))
			throw new APIError(`API '${apiController.constructor.name}' does not inherit from 'API'`, APIError.codes.INVALID_API);

		// Validate api process method
		if(!apiController.process || typeof apiController.process !== 'function')
			throw new APIError(`API '${apiController.constructor.name}' Method 'process' not found`, APIError.codes.INVALID_API);

		return apiController;
	}

}

module.exports = Fetcher;
