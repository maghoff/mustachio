'use strict';

const mustachio = require('../');
const chai = require('chai');

const assert = chai.assert;

function testRender(template, data, expected) {
	return done => {
		mustachio.string(template).render(data).string().then(actual => {
			assert.equal(expected, actual);
			done();
		}).catch(done);
	};
}

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
});
