'use strict';

const omit = require('lodash.omit');

const omitRecursive = (object, exclude) => {

	object = { ...object }; // Avoid original object modification

	Object.entries(object).forEach(([key, value]) => {
		object[key] = typeof value === 'object' && !Array.isArray(value) ? omitRecursive(value, exclude) : value;
	});

	return omit(object, exclude);
};

module.exports = {
	omitRecursive
};
