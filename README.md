# API

[![Build Status](https://travis-ci.org/janis-commerce/api.svg?branch=master)](https://travis-ci.org/janis-commerce/api)

A package for managing API from any origin.

## Installation

```
npm install @janiscommerce/api
```

## API
* **new API( object )**
Construct an API

* async **.dispatch()**
This method dispatch the api instance.
Returns an object with `code` and the `result`.

## Usage

```js
const API = require('@janiscommerce/api');

const myApi = new API({
	endpoint: 'api/peths',
	method: 'get', // this is the default verb
	data: { status: 'active' },
	headers: { 'Content-Type': 'application/json' },
	cookies: { 'my-cookie': 123 }
});

const result = await myApi.dispatch();

console.log(result);
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