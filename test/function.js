'use strict';

const mustachio = require('../');
const chai = require('chai');

const assert = chai.assert;

function testRender(template, data, expected) {
	return () => {
		const actual = mustachio.render(template, data);
		assert.equal(expected, actual);
	};
}

describe('function', function() {
	it('should resolve a simple function data item', testRender(
		"{{data}}",
		{ data: () => "katt" },
		"katt"));

	it('should resolve a function returning an object', testRender(
		"{{#data}}{{one}}{{two}}{{/data}}",
		{ data: () => ({ one: "ape", two: "katt" }) },
		"apekatt"));

	it('should resolve a function returning an array', testRender(
		"{{#data}}{{.}}{{/data}}",
		{ data: () => ["ape", "katt"] },
		"apekatt"));

	it('should resolve functions returning functions', testRender(
		"{{data}}",
		{ data: () => () => () => "apekatt" },
		"apekatt"));

	it('should resolve a function inside an array', testRender(
		"{{#array}}{{.}}{{/array}}",
		{ array: () => ["ape", () => "katt"] },
		"apekatt"));
});
