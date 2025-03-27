/* eslint-disable max-classes-per-file */

'use strict';

/**
 * @typedef {object} SampleAPIData
 * @property {string} foo
 */

/**
 * @typedef {[]} EmptyAPIPathParameters
 */

/**
 * @typedef {['id']} SampleAPIPathParameters
 */

const { API, ErrorWithVariables } = require('../../lib');

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class InvalidDataSchema extends API {
	get dataSchema() {
		return true;
	}

	async process() {
		this.setCode(200);
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class StructAndDataSchema extends API {

	get dataSchema() {
		return { foo: 'string' };
	}

	get struct() {
		return { foo: 'string' };
	}

	async process() {
		this.setCode(200);
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class NoProcess extends API {}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class EmptyProcess extends API {
	// eslint-disable-next-line no-empty-function
	async process() {}
}

/**
 * @template {object} RequestData
 * @template {string[]} PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ValidProcess extends API {
	async process() {
		this.setCode(200);
	}
}

/**
 * @extends {API<object, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidProcessWithBody extends API {
	async process() {
		this.setBody({ success: true });
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidProcessWithHeader extends API {
	async process() {
		this.setHeader('x-foo', 'bar');
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidProcessWithHeaders extends API {
	async process() {
		this.setHeader('x-test', 'yes');
		this.setHeaders({ 'x-foo': 'bar', 'x-baz': 'test' });
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidProcessWithCookie extends API {
	async process() {
		this.setCookie('x-foo', 'bar');
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidProcessWithCookies extends API {
	async process() {
		this.setCookies({ 'x-foo': 'bar', 'x-baz': 'test' });
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidProcessWithEmptyCookies extends API {
	async process() {
		this.setCookies({});
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidProcessWithCustomizedCookie extends API {
	async process() {
		this.setCookie('x-foo', {
			value: 'bar',
			domain: 'janis.in',
			expires: new Date('2025-03-21T21:00:00Z'),
			httpOnly: true,
			path: '/',
			secure: true
		});
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidProcessWithCustomizedCookieWithDefaults extends API {
	async process() {
		this.setCookie('x-foo', {
			value: 'bar'
		});
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidProcessWithHeadersAndCookies extends API {
	async process() {
		this.setHeader('x-test', 'yes');
		this.setHeaders({ 'x-foo': 'bar', 'x-baz': 'test' });
		this.setCookies({ 'x-foo': 'bar' });
	}
}

/**
 * @extends {ValidProcess<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidateOk extends ValidProcess {
	async validate() {
		this.checkSomething();
	}

	checkSomething() {}
}

/**
 * @extends {ValidProcess<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidateRejects extends ValidProcess {
	async validate() {
		throw new Error('Default validate error');
	}
}

/**
 * @extends {ValidProcess<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidateRejectsString extends ValidProcess {
	async validate() {
		// eslint-disable-next-line no-throw-literal
		throw 'Default validate error';
	}
}

/**
 * @extends {ValidProcess<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ValidateRejectsCustomCode extends ValidProcess {
	async validate() {
		this.setCode(404);
		throw new Error('Entity not found');
	}
}

/**
 * @extends {ValidProcess<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class Struct extends ValidProcess {
	get struct() {
		return { foo: 'string' };
	}
}

/**
 * @extends {ValidProcess<SampleAPIData & { bar: number | string}, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class StructMultiple extends ValidProcess {
	get struct() {
		return [{ foo: 'string', bar: 'number' }, { bar: 10 }];
	}

	async process() {
		// Return data with defaults as response body
		this.setBody(this.data);
	}
}

/**
 * @extends {API<SampleAPIData, []>}
 */
class DataSchema extends API {
	get dataSchema() {
		return { foo: 'string' };
	}

	async process() {
		this.setCode(200);
	}
}

/**
 * @extends {ValidProcess<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class RequestPassthrough extends ValidProcess {
	async process() {
		// Return request as response body
		this.setBody(this.request);
	}
}

/**
 * @extends {ValidProcess<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class RequestGettersPassthrough extends ValidProcess {
	async process() {
		// Return request as response body
		this.setBody({
			rawData: this.rawData,
			pathParameters: this.pathParameters,
			rawPathParameters: this.rawPathParameters,
			cookies: this.cookies
		});
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ProcessRejects extends API {
	async process() {
		throw new Error('Some internal error');
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ProcessRejectsString extends API {
	async process() {
		// eslint-disable-next-line no-throw-literal
		throw 'Some internal error';
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ProcessRejectsWithVariables extends API {
	async process() {
		throw new ErrorWithVariables('Some internal error', { foo: 'bar' });
	}
}

/**
 * @extends {API<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class ProcessRejectsCustomCode extends API {
	async process() {
		this.setCode(503);
		throw new Error('Some internal error');
	}
}

/**
 * @extends {ValidProcess<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class LogsDisabled extends ValidProcess {
	get shouldCreateLog() {
		return false;
	}

	async process() {
		this.setBody({ success: true });
	}
}

/**
 * @template {object} RequestData
 * @extends {ValidProcess<RequestData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class LogsMinimal extends ValidProcess {
	get shouldCreateLog() {
		return true;
	}

	get shouldLogRequestHeaders() {
		return false;
	}

	get shouldLogRequestData() {
		return false;
	}

	get shouldLogResponseBody() {
		return false;
	}

	async process() {
		this.setBody({ success: true });
	}
}

/**
 * @extends {ValidProcess<SampleAPIData, EmptyAPIPathParameters|SampleAPIPathParameters>}
 */
class LogsWithLessData extends ValidProcess {
	get shouldCreateLog() {
		return true;
	}

	get excludeFieldsLogRequestData() {
		return ['foo'];
	}

	get excludeFieldsLogResponseBody() {
		return ['bar'];
	}

	async process() {
		this.setBody(this.data);
	}
}

module.exports = {
	NoProcess,
	InvalidDataSchema,
	StructAndDataSchema,
	EmptyProcess,
	ValidProcess,
	ValidProcessWithBody,
	ValidProcessWithHeader,
	ValidProcessWithHeaders,
	ValidProcessWithCookie,
	ValidProcessWithCookies,
	ValidProcessWithEmptyCookies,
	ValidProcessWithCustomizedCookie,
	ValidProcessWithCustomizedCookieWithDefaults,
	ValidProcessWithHeadersAndCookies,
	ValidateOk,
	ValidateRejects,
	ValidateRejectsString,
	ValidateRejectsCustomCode,
	Struct,
	StructMultiple,
	DataSchema,
	RequestPassthrough,
	RequestGettersPassthrough,
	ProcessRejects,
	ProcessRejectsString,
	ProcessRejectsWithVariables,
	ProcessRejectsCustomCode,
	LogsDisabled,
	LogsMinimal,
	LogsWithLessData
};
