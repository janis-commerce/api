/* eslint-disable max-classes-per-file */

'use strict';

const { API, ErrorWithVariables } = require('../../lib');

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class NoProcess extends API {}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class EmptyProcess extends API {
	// eslint-disable-next-line no-empty-function
	async process() {}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ValidProcess extends API {
	async process() {
		this.setCode(200);
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ValidProcessWithBody extends API {
	async process() {
		this.setBody({ success: true });
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ValidProcessWithHeader extends API {
	async process() {
		this.setHeader('x-foo', 'bar');
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ValidProcessWithHeaders extends API {
	async process() {
		this.setHeader('x-test', 'yes');
		this.setHeaders({ 'x-foo': 'bar', 'x-baz': 'test' });
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ValidProcessWithCookie extends API {
	async process() {
		this.setCookie('x-foo', 'bar');
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ValidProcessWithCookies extends API {
	async process() {
		this.setCookies({ 'x-foo': 'bar', 'x-baz': 'test' });
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ValidProcessWithEmptyCookies extends API {
	async process() {
		this.setCookies({});
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
 */
class ValidateOk extends ValidProcess {
	async validate() {
		this.checkSomething();
	}

	checkSomething() {}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
 */
class ValidateRejects extends ValidProcess {
	async validate() {
		throw new Error('Default validate error');
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
 */
class ValidateRejectsString extends ValidProcess {
	async validate() {
		// eslint-disable-next-line no-throw-literal
		throw 'Default validate error';
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
 */
class ValidateRejectsCustomCode extends ValidProcess {
	async validate() {
		this.setCode(404);
		throw new Error('Entity not found');
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
 */
class Struct extends ValidProcess {
	get struct() {
		return { foo: 'string' };
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
 */
class RequestPassthrough extends ValidProcess {
	async process() {
		// Return request as response body
		this.setBody(this.request);
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ProcessRejects extends API {
	async process() {
		throw new Error('Some internal error');
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ProcessRejectsString extends API {
	async process() {
		// eslint-disable-next-line no-throw-literal
		throw 'Some internal error';
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ProcessRejectsWithVariables extends API {
	async process() {
		throw new ErrorWithVariables('Some internal error', { foo: 'bar' });
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {API<RequestData, PathParameters>}
 */
class ProcessRejectsCustomCode extends API {
	async process() {
		this.setCode(503);
		throw new Error('Some internal error');
	}
}

/**
 * @template RequestData
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
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
 * @template PathParameters
 * @extends {ValidProcess<RequestData, PathParameters>}
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
