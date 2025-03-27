'use strict';

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
 * @param {unknown} objectOrArray
 * @param {string[]|null} exclude
 * @return {unknown}
 */
const omitRecursive = (objectOrArray, exclude) => {

	if(!exclude?.length)
		return objectOrArray;

	const excludeAsKeyValue = exclude.reduce((/** @type {Record<string, true>} */accum, field) => {
		accum[field] = true;
		return accum;
	}, {});

	const wasArray = Array.isArray(objectOrArray);

	const array = Array.isArray(objectOrArray) ? objectOrArray : [objectOrArray];

	const parsedArray = array.map(element => {

		/** @type {Record<string, unknown>} */
		const newElement = {};

		Object.entries(element).forEach(([key, value]) => {

			if(excludeAsKeyValue[key])
				return;

			newElement[key] = isObject(value) ? omitRecursive(value, exclude) : value;
		});

		return newElement;

	});

	return wasArray ? parsedArray : parsedArray[0];
};

/**
 * @template T
 * @param {Record<string,T>|T[]} value
 * @returns {Record<string,T>|T[]} The value with every string trimmed
 */
const trimObjectValues = value => {

	if(Array.isArray(value))
		// @ts-expect-error TS2322 Typecheck fails for recursive values
		return value.map(v => trimObjectValues(v));

	Object.keys(value).forEach(k => {

		if((typeof value[k] === 'string'))
			// @ts-expect-error TS2322 Typecheck fails for recursive values
			value[k] = value[k].trim();

		if(isObject(value[k]))
			// @ts-expect-error TS2322 Typecheck fails for recursive values
			value[k] = trimObjectValues(value[k]);
	});

	return value;
};

module.exports = {
	isObject,
	omitRecursive,
	trimObjectValues
};
