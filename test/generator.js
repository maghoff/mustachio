'use strict';

const mustachio = require('../');
const util = require('./util');
const testRender = util.testRender, expectError = util.expectError;

describe('generator', function() {
	it('should resolve a simple generator function data item', testRender(
		"{{#data}}{{.}}{{/data}}",
		{ data: function* () { yield "ape"; yield "katt"; } },
		"apekatt"));

	it('should allow objects yielded from generator functions', testRender(
		"{{#data}}{{one}}{{two}}{{/data}}",
		{ data: function* () { yield { one: "ape", two: "katt" } } },
		"apekatt"));

	it('should allow nested generators', testRender(
		"{{#data}}{{#.}}{{.}}{{/.}}{{/data}}",
		{ data: function* () {
			yield function* () {
				yield "ape";
			};
		} },
		"ape"));

	it('should propagate error', expectError(
		"{{#data}}{{#.}}{{.}}{{/.}}{{/data}}",
		{ data: function* () {
			yield "ape";
			throw new Error("katt");
		} }));
});
