# API

[![Build Status](https://travis-ci.org/janis-commerce/api.svg?branch=master)](https://travis-ci.org/janis-commerce/api)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api?branch=master)

A package for managing API from any origin.

## Installation

```bash
npm install @janiscommerce/api
```

## Client injection
The module can detect and inject a client. This works with configurable identifiers.
The api can receive the identifier and an internal model will get an inject the client for you.
The identifiers can be configurated with the package [Settings](https://www.npmjs.com/package/@janiscommerce/settings) in the key `api.identifiers`.

### Active Client
For the client injection functionality si required to install the package `active-client`.
The package `active-client` will get in DB by the field configurated in the identifiers and received in the api.
For more information see [Active Client](https://www.npmjs.com/package/@janiscommerce/active-client)

### Examples of configuration in **.janiscommercerc.json**

1. In this case `api` will use the *header* 'client' getting in DB using the field **name**

```json
{
	"api": {
		"identifiers": {
			"header": "client",
			"clientField": "name"
		}
	}
}
```

2. In this case `api` will search the client using `client-id` or `client-code` (sent in qs or requestBody), the field in DB is `id` and `code` respectively.
```json
{
	"api": {
		"identifiers": [{
			"data": "client-id",
			"clientField": "id"
		}, {
			"data": "client-code",
			"clientField": "code"
		}]
	}
}
```


### Public methods

* **.dispatch()** (*async*)
This method dispatch the api instance. Returns an object with `code` and the `body`.

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

* **pathParameters** (*getter*).
Returns the path parameters of the request.

* **headers** (*getter*).
Returns the the headers of the request.

* **cookies** (*getter*).
Returns the the cookies of the request.

* **setCode(code)**.
Set a response httpCode. `code` must be a integer.

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

* **getController(ControllerName)**.
Get a Controller instance with client injected.

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
