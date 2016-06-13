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

describe('render', function() {
	it('should not interpolate a simple string', testRender("apekatt", {}, "apekatt"));
	it('should manage lots of empty interpolations', testRender("ap{{}}ek{{}}at{{}}t", {}, "apekatt"));
	it('should interpolate', testRender("ape{{feline}}", { feline: "katt" }, "apekatt"));

	it('should complain about unclosed tag', function () {
		chai.expect(() => mustachio.string("ape{{katt")).to.throw();
	});

	it('should interpolate 0 as number', testRender("ape{{zero}}katt", { zero: 0 }, "ape0katt"));
});
