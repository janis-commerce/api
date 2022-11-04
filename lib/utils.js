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

const trimObjectValues = value => {

	if(typeof value !== 'object' || !value)
		return value;

	Object.keys(value).forEach(k => {

		if((typeof value[k] === 'string'))
			value[k] = value[k].trim();

		if(typeof value[k] === 'object' && value[k] !== null)
			value[k] = trimObjectValues(value[k]);
	});

	return value;
};

module.exports = {
	isObject,
	omitRecursive,
	trimObjectValues,
	cloneObj
};
