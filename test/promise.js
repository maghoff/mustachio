'use strict';

const stream = require('stream');
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
});
