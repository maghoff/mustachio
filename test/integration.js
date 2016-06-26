'use strict';

const mustachio = require('../');
const util = require('./util');
const testRender = util.testRender;

describe('integration', function() {
	it('should resolve functions yielded from generators', testRender(
		"{{#data}}{{.}}{{/data}}",
		{ data: function* () {
			yield () => "ape";
			yield "katt";
		} },
		"apekatt"));

	it('should resolve functions resolved in promises', testRender(
		"{{data}}",
		{ data: Promise.resolve(() => "apekatt") },
		"apekatt"));

	it('should resolve generators resolved in promises', testRender(
		"{{#data}}{{.}}{{/data}}",
		{ data: Promise.resolve(function* () { yield "ape"; yield "katt"; }) },
		"apekatt"));
});
