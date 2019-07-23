'use strict';

const logger = require('@janiscommerce/logger');

const path = require('path');

const {
	flow, toLower, split, join
} = require('lodash/fp');
let { filter } = require('lodash/fp');

const API = require('./api');
const APIError = require('./error');

filter = filter.convert({ cap: false }); // to use index

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

		const urlParts = flow(
			toLower,
			split('/'),
		)(this.endpoint);

		// if request a list of resources the method is 'list', otherwise is the method
		const method = (this.method === 'get' && urlParts.length % 2 === 1) ? 'list' : this.method;

		const filePath = flow(
			filter((value, index) => index % 2 === 0),
			join('/')
		)(urlParts);

		return path.join(this.constructor.apiPath, filePath, method);
	}

	/**
	 * @return {Array} Path parameters
	 */
	get pathParameters() {
		return flow(
			toLower,
			split('/'),
			filter((value, index) => index % 2 === 1)
		)(this.endpoint);
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

		} catch(err) {

			/* istanbul ignore next */
			if(err instanceof ReferenceError || err instanceof TypeError || err instanceof SyntaxError || err instanceof RangeError
				|| err.code !== 'MODULE_NOT_FOUND' || !(~err.message.indexOf(filePath)))
				/* istanbul ignore next */
				logger.error('Module', err);

			APIController = false;
		}

		if(!APIController)
			throw new APIError(`Invalid API Controller '${filePath}'`, APIError.codes.API_NOT_FOUND);

		let apiController;

		try {
			apiController = new APIController();
		} catch(err) {
			throw new APIError(`API Controller '${filePath}' is not a API class`, APIError.codes.INVALID_API);
		}

		// validate api inheritance
		if(!(apiController instanceof API))
			throw new Error(`API '${apiController.constructor.name}' does not inherit from 'API'`);

		// validate api process method
		if(!apiController.process || typeof apiController.process !== 'function')
			throw new Error(`API '${apiController.constructor.name}' Method 'process' not found`);

		return apiController;
	}

}

module.exports = Fetcher;
