'use strict';

const mustachio = require('../');
const util = require('./util');
const testRender = util.testRender, expectError = util.expectError;

describe('promise', function() {
	it('should resolve a simple promise', testRender(
		"{{data}}",
		{ data: Promise.resolve("apekatt") },
		"apekatt"));

	it('should resolve a non-terminal promise', testRender(
		"{{nested.data}}",
		{ nested: Promise.resolve({ data: "apekatt" }) },
		"apekatt"));

	it('should resolve nested promises', testRender(
		"{{data}}",
		{ data: Promise.resolve(Promise.resolve(Promise.resolve("apekatt"))) },
		"apekatt"));

	it('should resolve when root is Promise', testRender(
		"ape{{feline}}",
		Promise.resolve({ feline: "katt" }),
		"apekatt"));

	it('should propagate errors', expectError(
		"{{data}}",
		{ data: Promise.reject(new Error("apekatt")) }));
});
