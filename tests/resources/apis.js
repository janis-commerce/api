/* eslint-disable max-classes-per-file */

'use strict';

const { API, ErrorWithVariables } = require('../../lib');

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class InvalidDataSchema extends API {
	// @ts-expect-error TS2416
	get dataSchema() {
		return true;
	}

	async process() {
		this.setCode(200);
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class StructAndDataSchema extends API {

	/**
	 * @returns {import('fastest-validator').ValidationSchema<RequestData>}
	 */
	get dataSchema() {
		// @ts-expect-error TS2353
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
 * @template RequestData
 * @extends {API<RequestData>}
 */
class NoProcess extends API {}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class EmptyProcess extends API {
	// eslint-disable-next-line no-empty-function
	async process() {}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ValidProcess extends API {
	async process() {
		this.setCode(200);
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ValidProcessWithBody extends API {
	async process() {
		this.setBody({ success: true });
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ValidProcessWithHeader extends API {
	async process() {
		this.setHeader('x-foo', 'bar');
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ValidProcessWithHeaders extends API {
	async process() {
		this.setHeader('x-test', 'yes');
		this.setHeaders({ 'x-foo': 'bar', 'x-baz': 'test' });
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ValidProcessWithCookie extends API {
	async process() {
		this.setCookie('x-foo', 'bar');
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ValidProcessWithCookies extends API {
	async process() {
		this.setCookies({ 'x-foo': 'bar', 'x-baz': 'test' });
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ValidProcessWithEmptyCookies extends API {
	async process() {
		this.setCookies({});
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
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
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ValidProcessWithCustomizedCookieWithDefaults extends API {
	async process() {
		this.setCookie('x-foo', {
			value: 'bar'
		});
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ValidProcessWithHeadersAndCookies extends API {
	async process() {
		this.setHeader('x-test', 'yes');
		this.setHeaders({ 'x-foo': 'bar', 'x-baz': 'test' });
		this.setCookies({ 'x-foo': 'bar' });
	}
}

/**
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
 */
class ValidateOk extends ValidProcess {
	async validate() {
		this.checkSomething();
	}

	checkSomething() {}
}

/**
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
 */
class ValidateRejects extends ValidProcess {
	async validate() {
		throw new Error('Default validate error');
	}
}

/**
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
 */
class ValidateRejectsString extends ValidProcess {
	async validate() {
		// eslint-disable-next-line no-throw-literal
		throw 'Default validate error';
	}
}

/**
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
 */
class ValidateRejectsCustomCode extends ValidProcess {
	async validate() {
		this.setCode(404);
		throw new Error('Entity not found');
	}
}

/**
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
 */
class Struct extends ValidProcess {
	get struct() {
		return { foo: 'string' };
	}
}

/**
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
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
 * @template RequestData
 * @extends {API<RequestData>}
 */
class DataSchema extends API {
	/**
	 * @returns {import('fastest-validator').ValidationSchema<RequestData>}
	 */
	get dataSchema() {
		// @ts-expect-error TS2353
		return { foo: 'string' };
	}

	async process() {
		this.setCode(200);
	}
}

/**
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
 */
class RequestPassthrough extends ValidProcess {
	async process() {
		// Return request as response body
		this.setBody(this.request);
	}
}

/**
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
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
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ProcessRejects extends API {
	async process() {
		throw new Error('Some internal error');
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ProcessRejectsString extends API {
	async process() {
		// eslint-disable-next-line no-throw-literal
		throw 'Some internal error';
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ProcessRejectsWithVariables extends API {
	async process() {
		throw new ErrorWithVariables('Some internal error', { foo: 'bar' });
	}
}

/**
 * @template RequestData
 * @extends {API<RequestData>}
 */
class ProcessRejectsCustomCode extends API {
	async process() {
		this.setCode(503);
		throw new Error('Some internal error');
	}
}

/**
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
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
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
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
 * @template RequestData
 * @extends {ValidProcess<RequestData>}
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
