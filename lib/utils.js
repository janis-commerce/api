'use strict';

const omit = require('lodash.omit');

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

module.exports = {
	isObject,
	omitRecursive
};
