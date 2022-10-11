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

const trimObjectValues = object => {

	if(typeof object !== 'object' || object === null)
		return {};

	Object.keys(object).forEach(k => {
		if((typeof object[k] === 'string'))
			object[k] = object[k].trim();
		else
			trimObjectValues(object[k]);
	});

	return object;
};

module.exports = {
	isObject,
	omitRecursive,
	trimObjectValues,
	cloneObj
};
