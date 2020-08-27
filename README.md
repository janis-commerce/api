# api

![Build Status](https://github.com/janis-commerce/api/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fapi.svg)](https://www.npmjs.com/package/@janiscommerce/api)

A package for managing API from any origin.


## Installation

```bash
npm install @janiscommerce/api
```

## API

This is the class you should extend to code your own APIs. You can customize them with the following methods and getters:

### get struct()
This optional getter should return a valid [struct](https://www.npmjs.com/package/superstruct). If it doesn't match the data, default http code is set to 400.

**IMPORTANT** In case you return an array, each element will be passed as an argument to struct validation (see examples below). To validate an array, use `struct.list()` instead.

### async validate()
This optional method should throw an Error in case of validation failure. It's message will be set in the response body. It's return value will be discarded.

### async process()
This method is required, and should have the logic of your API. At this point, request should be already validated. If you throw an error here, default http code is set to 500.

The following methods will be inherited from the base API Class:

### Getters

* **pathParameters** (*getter*).
Returns the path parameters of the request as an array of values. For example: /store/10/schedules will generate the following path parameters: ['10']

* **headers** (*getter*).
Returns the the headers of the request as a key-value object.

* **cookies** (*getter*).
Returns the the cookies of the request as a key-value object.

* **shouldCreateLog(*getter*)**.
Returns if the api execution should be logged as a boolean.

* **shouldLogRequestData(*getter*)**.
Returns if the api request data should be logged as a boolean.

* **shouldLogRequestHeaders(*getter*)**.
Returns if the api response data should be logged as a boolean.

* **excludeFieldsLogRequestData(*getter*)**.
Returns the fields to exclude from the api request data that will be logged as an array.

* **excludeFieldsLogResponseBody(*getter*)**.
Returns the fields to exclude from the api response body that will be logged as an array.

### Setters

All this setters are chainable!

* **setCode(code)**.
Set a response httpCode. `code` must be a integer. This will prevent default http codes to be set.

* **setHeader(headerName, headerValue)**.
Set an individual response header. `headerName` must be a string.

* **setHeaders(headers)**.
Set response headers. `headers` must be an object with "key-value" headers.

* **setCookie(cookieName, cookieValue)**.
Set an individual response cookie. `cookieName` must be a string.

* **setCookies(cookies)**.
Set response cookies. `cookies` must be an object with "key-value" cookies.

* **setBody(body)**.
Set the response body.

## Dispatcher

This is the class you should use to dispatch your APIs. It takes the request data as constructor arguments and then finds you API file based on the endpoint and executes it.

### constructor(request)
The request must be an object and can be setup using the following properties:

* endpoint {string} **required** The API endpoint called
* method {string} The HTTP Method used in the request. Default: `'get'`.
* data {mixed} The data received in the API (query string or request body). Default: `{}`.
* headers {object} A key-value object containing the request headers. Default: `{}`.
* cookies {object} A key-value object containing the request cookies. Default: `{}`.
* authenticationData {object} An object containing the request authentication data (see [Session injection](#session-injection)). Default: `{}`.

### async dispatch()
This will dispatch the API. It resolves to an object with the API execution result, with the following properties:

* code {number} The return http code. Default: `200`.
* body {mixed} The response body
* headers {object} A key-value object containing the response headers
* cookies {object} A key-value object containing the response cookies


## APIError

Every error handled by this package will be an instance of this class. You might find more information about the error source in the `previousError` property.

It also uses the following error codes:

| Name | Value | Description |
| --- | --- | --- |
| Invalid request data | 1 | The request parameters received are not an object |
| Invalid endpoint | 2 | The request endpoint received is not a string |
| Invalid method | 3 | The request method received is not a string |
| Invalid headers | 4 | The request headers received are not an object |
| Invalid cookies | 5 | The request cookies received are not an object |
| API not found | 6 | The endpoint does not correspond to an API file. This sets the default http code to 404 |
| Invalid API | 7 | The API does not inherit from API class or does not implement the `process` method |
| Invalid struct | 8 | The request data does not match the API struct |
| Invalid authentication data | 9 | The request authentication data received is not an object |


## ErrorWithVariables

This is an error class to use to return easily a message and variables apply to it, for example to handle error translation properly.

Every variable should be a scalar (not an array or object). Otherwise it will be casted to a string.

```js
const { ErrorWithVariables } = require('@janiscommerce/api');

throw new ErrorWithVariables('some.error.to.translate', {
	name: 'Some name to replace in translation'
})
```

## Session injection
*Since 2.0.0*

This package implements [API Session](https://www.npmjs.com/package/@janiscommerce/api-session). In order to associate a request to a session, you must pass a valid authentication data in the `authenticationData` property of the Dispatcher constructor.

Session details and customization details can be found in api-session README.

## API Examples

### Basic API

```js
'use strict';

const { API } = require('@janiscommerce/api');

class MyApi extends API {

	async process() {
		this.setBody({
			message: 'Success'
		});
	}

}

module.exports = MyApi;
```

### API with struct and custom validation

```js
'use strict';

const { API } = require('@janiscommerce/api');

class MyApi extends API {

	get struct() {
		return {
			foo: 'string'
		};
	}

	async validate() {
		if(!this.data.foo.match(/(bar)+/))
			throw new Error('Foo must be one or more bars');
	}

	async process() {
		this.setBody({
			message: 'Success'
		});
	}

}

module.exports = MyApi;
```

### API with struct with defaults

```js
'use strict';

const { API } = require('@janiscommerce/api');

class MyApi extends API {

	get struct() {
		return [{
			foo: 'string?'
		}, {
			// Defaults
			foo: 'bar'
		}];
	}

	async process() {
		this.setBody({
			message: 'Success'
		});
	}

}

module.exports = MyApi;
```

### API with custom validation http status

```js
'use strict';

const { API } = require('@janiscommerce/api');

const UserValidator = require('user-validator');

class MyApi extends API {

	get struct() {
		return {
			userId: 'number'
		};
	}

	async validate() {
		if(!UserValidator.isValidId(this.data.userId)) {
			this.setCode(401);
			throw new Error('Unauthorized');
		}
	}

	async process() {
		this.setBody({
			message: 'Success'
		});
	}

}

module.exports = MyApi;
```

### API with custom response http code and headers

```js
'use strict';

const { API } = require('@janiscommerce/api');

class MyApi extends API {

	async process() {
		this
			.setHeader('x-foo', 'bar')
			.setCode(201)
			.setBody({
				message: 'Created'
			});
	}

}

module.exports = MyApi;
```

### API injected session

```js
'use strict';

const { API } = require('@janiscommerce/api');

const UserValidator = require('user-validator');

class MyApi extends API {

	get struct() {
		return {
			userId: 'number'
		};
	}

	async validate() {

		const userValidator = this.session.getSessionInstance(UserValidator);

		if(!userValidator.isValidId(this.data.userId)) {
			this.setCode(401);
			throw new Error('Unauthorized');
		}
	}

	async process() {
		this.setBody({
			message: 'Success'
		});
	}

}

module.exports = MyApi;
```

## Dispatcher Examples

### Full request dispatcher

```js
'use strict';

const { Dispatcher } = require('@janiscommerce/api');

const dispatcher = new Dispatcher({
	endpoint: 'store/10/schedules',
	method: 'get',
	data: { status: 'active' },
	headers: { 'Content-Type': 'application/json' },
	cookies: { 'my-cookie': 'cookie-value' },
	authenticationData: { userId: 10, clientCode: 'janiscommerce' }
});

const response = await dispatcher.dispatch();
```

## Serverless, REST APIs and unit testing

To implement predictable REST APIs, there are a couple packages that extend this one:

* [List APIs](https://www.npmjs.com/package/@janiscommerce/api-list): To implement resource listing APIs, with standarized sorting, pagination, filtering and responses.
* [Get APIs](https://www.npmjs.com/package/@janiscommerce/api-get): To implement one-resource get APIs with ease.
* [Save APIs](https://www.npmjs.com/package/@janiscommerce/api-save): To implement one-resource create/update APIs with ease, with standarized validation and

To implement this on serverless, there is a REST API handler that can be used out-of-the-box:

* [Serverless REST API](https://www.npmjs.com/package/@janiscommerce/sls-api-rest): To implement API dispatching in AWS Api Gateway + Lambda with ease.

To implement unit tests in your APIs, there is a also a package:

* [API Test](https://www.npmjs.com/package/@janiscommerce/api-test): To run unit tests on your APIs like a boss.
