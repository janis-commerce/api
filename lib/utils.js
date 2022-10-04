'use strict';

const omit = require('lodash.omit');
const cloneObj = require('lodash.clonedeep');

/**
 * Determines if the passed value is an object.
 *
 * @param {*} value The value
 * @return {boolean} True if object, False otherwise.
 */
const isObject = value => {
	return !!value && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Returns a new object excluding one or more properties recursively
 *
 * @param {Object<string, *>} object
 * @param {string|Array<string>} exclude
 */
const omitRecursive = (object, exclude) => {

	object = { ...object }; // Avoid original object modification

	Object.entries(object).forEach(([key, value]) => {
		object[key] = isObject(value) ? omitRecursive(value, exclude) : value;
	});

	return omit(object, exclude);
};

const trimObjValues = obj => {

	Object.keys(obj).forEach(k => {
		if((typeof obj[k] === 'string'))
			obj[k] = obj[k].trim();
		else
			trimObjValues(obj[k]);
	});

	return obj;
};

const trimRecursive = obj => {

	if(Array.isArray(obj))
		return obj.map(object => trimObjValues(object));

	return trimObjValues(obj);
};


module.exports = {
	isObject,
	omitRecursive,
	trimRecursive,
	cloneObj
};
