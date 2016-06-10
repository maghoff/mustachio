'use strict';

const mustachio = require('../');
const chai = require('chai');

const assert = chai.assert;

function testRender(template, data, expected) {
	return done => {
		mustachio.render(template, data).then(actual => {
			try {
				assert.equal(expected, actual);
				done();
			}
			catch (err) {
				done(err);
			}
		})
		.catch(done);
	};
}

describe('render', function() {
	it('should not interpolate a simple string', testRender("apekatt", {}, "apekatt"));
	it('should manage lots of empty interpolations', testRender("ap{{}}ek{{}}at{{}}t", {}, "apekatt"));
	it('should interpolate', testRender("ape{{feline}}", { feline: "katt" }, "apekatt"));

	it('should complain about unclosed tag', function () {
		chai.expect(() => mustachio.string("ape{{katt")).to.throw();
	});

	it('should interpolate 0 as number', testRender("ape{{zero}}katt", { zero: 0 }, "ape0katt"));
});
