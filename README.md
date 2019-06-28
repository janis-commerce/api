# API

[![Build Status](https://travis-ci.org/janis-commerce/api.svg?branch=master)](https://travis-ci.org/janis-commerce/api)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api?branch=master)

A package for managing API from any origin.

## Installation

```
npm install @janiscommerce/api
```

## Dispatcher
* **new Dispatcher( object )**
Construct a Dispatcher with the request information

### Public methods

* async **.dispatch()**
This method dispatch the api instance.
Returns an object with `code` and the `body`.

## Usage

### How to dispatch an API? (from a server)

```js
const { Dispatcher } = require('@janiscommerce/api');

const dispatcher = new Dispatcher({
	endpoint: 'api/pets',
	method: 'get', // this is the default verb
	data: { status: 'active' },
	headers: { 'Content-Type': 'application/json' },
	cookies: { 'my-cookie': 123 }
});

const response = await dispatcher.dispatch();

console.log(response);
/**
	expected output:

	{
		code: 200,
		body: [
			{
				id: 1,
				type: 'dog',
				breed: 'pug',
				name: 'Batman'
			}, {
				id: 2,
				type: 'dog',
				breed: 'chihuahua',
				name: 'Chico'
			}
		]
	}
*/
```

## API
You should extend your apis from this module.

### Public methods

* **pathParameters** (*getter*). Returns the path parameters of the request.

* **headers** (*getter*). Returns the the headers of the request.

* **cookies** (*getter*). Returns the the cookies of the request.

* **setCode(code)**. Set a response httpCode. `code` must be a integer.

* **setHeader(headerName, headerValue)**. Set an individual response header. `headerName` must be a string.

* **setHeaders(headers)**. Set response headers. `headers` must be an object with "key-value" headers.

* **setCookie(cookieName, cookieValue)**. Set an individual response cookie. `cookieName` must be a string.

* **setCookies(cookies)**. Set response cookies. `cookies` must be an object with "key-value" cookies.

* **setBody(body)**. Set the response body.

* **getController(ControllerName)**. Get a Controller instance with client injected.

### How to validate the API Structure (query string or request body)?
The API Struct is easily validated using [superstruct](https://www.npmjs.com/package/superstruct) (Thank's superstruct :pray:)
If you want to use this validation, you should add a getter method `struct()`.

```js
const { API } = require('@janiscommerce/api');

class MyApi extends API {

	/**
	 * Optional method for struct validation (qs or requestBody)
	 */
	get struct() {
		return {
			id: 'number',
			name: 'string'
		};
	}
}

module.exports = MyApi;

```

### How to add custom validation for my API?
The way to add some custom validation is adding a `validate()` method.
This method is called by `Dispatcher` after validate de Struct.

```js
const { API } = require('@janiscommerce/api');

class MyApi extends API {

	/**
	 * Optional method for extra validation
	 */
	async validate() {

		if(this.data.id > 10)
			throw new Error('Weird validation fail'); // this will response a 400 error

		if(!existsInMyDB(this.data.id)) {
			this.setCode(404); // set a custom http resposne code
			throw new Error('resource not found'); // this will response a 404 error
		}
	}
}

module.exports = MyApi;

```

### How to process the API and response correctly?

```js
const { API } = require('@janiscommerce/api');

class MyApi extends API {
	/**
	 * Required method for api process
	 */
	async process() {

		if(!saveInMyDB(this.data))
			throw new Error('internal save error'); // this will response a 500 error

		if(!saveOtherThingInMyDB(this.data)) {
			this.setCode(504); // set a custom http resposne code
			throw new Error('internal save error');
		}

		this
			.setHeader('my-header-1', 'foo')
			.setHeaders({ 'my-header-2': 'foo', 'my-header-3': 'foo' })
			.setCookie('my-cookie-1', 'bar')
			.setCookies({ 'my-cookie-2': 'bar', 'my-cookie-3': 'bar' })
			.setBody({
				'response-body': 123
			});
	}
}

module.exports = MyApi;

```
