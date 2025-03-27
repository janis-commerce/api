/* eslint-disable max-classes-per-file */

'use strict';

// @ts-expect-error TS7016
const { struct } = require('@janiscommerce/superstruct');
// @ts-expect-error TS7016
const Events = require('@janiscommerce/events');

/** @type {typeof import('fastest-validator').default} */
// @ts-expect-error TS2741
const Validator = require('fastest-validator');
// @ts-expect-error TS2741
const logger = require('lllog')();

const LogHelper = require('./helpers/log');
const RequestParser = require('./helpers/request-parser');
const ResponseParser = require('./helpers/response-parser');
const APIError = require('./error');
const ErrorWithVariables = require('./error-with-variables');

const DEFAULT_SUCCESS_STATUS_CODE = 200;

module.exports = class Handler {

	/**
	 * @param {typeof import('./apis/generic')} APIClass
	 */
	constructor(APIClass) {
		/**
		 * @private
		 */
		this.api = new APIClass();

		this.compileDataValidator();
	}

	/**
	 * @param {import('./types/request').RawRequestEvent} event
	 */
	async handle(event) {

		this.executionStarted = Date.now();

		const logId = LogHelper.generateId();

		// this variable is used for every Log that the Api will add, see more in @janiscommerce/log
		process.env.JANIS_API_REQUEST_LOG_ID = logId;

		LogHelper.start();

		const request = RequestParser.parse(event, logId);

		this.api.request = request;

		return this.processRequest();
	}

	/**
	 * @private
	 */
	compileDataValidator() {

		if(!this.api?.dataSchema)
			return;

		if(this.api.struct)
			throw new Error('Cannot use struct and dataSchema at the same time');

		const v = new Validator({ haltOnFirstError: true });
		this.dataValidator = v.compile(this.api.dataSchema);
	}

	/**
	 * @private
	 */
	async processRequest() {

		try {

			// Check data structure if any
			this.validateDataStructure();

			// API request custom validation
			await this.api.validate();

		} catch(err) {

			if(!this.api.response.code)
				// @ts-expect-error TS18046
				this.api.setCode(err.statusCode || 400);

			await this.handleRequestFinished();

			if(!(err instanceof Error))
				return this.respondError(new Error(String(err)));

			return this.respondError(err);

		}

		try {

			await this.api.process();

			return this.respond();

		} catch(err) {

			if(!this.api.response.code)
				// @ts-expect-error TS18046
				this.api.setCode(err.statusCode || 500);

			if(!(err instanceof Error))
				return this.respondError(new Error(String(err)));

			return this.respondError(err);

		} finally {
			await this.handleRequestFinished();
		}
	}

	/**
	 * @private
	 */
	validateDataStructure() {

		// Data validator - Has priority over old struct
		if(this.dataValidator) {
			const result = this.dataValidator(this.api.request.data);

			if(Array.isArray(result))
				throw new APIError(result[0]?.message || /* istanbul ignore next */ 'Unknown validation error', APIError.codes.INVALID_STRUCT);

			return;
		}

		if(this.api.struct)
			return this.validateLegacyStruct();
	}

	/**
	 * @private
	 * @deprecated Struct is not recommended any more
	 */
	validateLegacyStruct() {

		const args = !Array.isArray(this.api.struct) ? [this.api.struct] : this.api.struct;

		const Schema = struct(...args);

		const [error, parsed] = Schema.validate(this.api.data);

		if(error)
			throw new APIError(error.reason || error.message, APIError.codes.INVALID_STRUCT);

		this.api.request.data = parsed; // Parsed data with default values added.
	}

	/**
	 * @private
	 * @param {import('./error-with-variables')|APIError|Error} error
	 */
	respondError(error) {

		logger.error(error);

		this.api.setBody({
			message: error.message,
			...(error instanceof ErrorWithVariables && error.messageVariables && { messageVariables: error.messageVariables })
		});

		return ResponseParser.parse(this.api.response, this.api.session.clientCode);
	}

	/**
	 * @private
	 */
	respond() {

		// Set default status code
		if(!this.api.response.code)
			this.api.setCode(DEFAULT_SUCCESS_STATUS_CODE);

		return ResponseParser.parse(this.api.response, this.api.session.clientCode);
	}

	handleRequestFinished() {

		// @ts-expect-error TS2532
		this.api.executionTime = Date.now() - this.executionStarted;

		return Promise.all([
			LogHelper.save(this.api),
			Events.emit('janiscommerce.ended')
		]);
	}

};
