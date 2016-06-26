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
