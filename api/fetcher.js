'use strict';

const logger = require('@janiscommerce/logger');

const path = require('path');

const {
	flow, tail, toLower, split, join
} = require('lodash/fp');
let { filter } = require('lodash/fp');

const APIError = require('./error');

filter = filter.convert({ cap: false }); // to use index

class Fetcher {

	static get folder() {
		return 'api';
	}

	static get apiPath() {
		return path.join(process.cwd(), this.folder);
	}

	constructor(endpoint, method) {
		this.endpoint = endpoint;
		this.method = method.toLocaleLowerCase();
	}

	/**
	 * Get a new REST API Controller Instance
	 *
	 * @param {string} file The file
	 * @return {Module} The rest controller.
	 */
	getAPIController() {

		const filePath = this._getFilePath();

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
			throw new APIError(`API Controller '${filePath}' is not a api class`, APIError.codes.INVALID_API);
		}

		return apiController;
	}

	/**
	 * Make and returns the fileName based on endpoint and http method
	 * @example
	 * this._getFilePath() // this.endpoint = '/products/10/skus/'; this.method = 'get'
	 * products/skus/get.js
	 */
	_getFilePath() {

		const urlParts = flow(
			toLower,
			split('/'),
			tail
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
	 * @param {Array} Path parameters
	 */
	getPathParameters() {
		return flow(
			toLower,
			split('/'),
			tail,
			filter((value, index) => index % 2 === 1)
		)(this.endpoint);
	}

}

module.exports = Fetcher;
