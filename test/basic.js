'use strict';

const mustachio = require('../');
const chai = require('chai');
const util = require('./util');
const testRender = util.testRender;

describe('render', function() {
	it('should not interpolate a simple string', testRender("apekatt", {}, "apekatt"));
	it('should manage lots of empty interpolations', testRender("ap{{}}ek{{}}at{{}}t", {}, "apekatt"));
	it('should interpolate', testRender("ape{{feline}}", { feline: "katt" }, "apekatt"));

	it('should complain about unclosed tag', function () {
		chai.expect(() => mustachio.string("ape{{katt")).to.throw();
	});

	it('should interpolate 0 as number', testRender("({{zero}})", { zero: 0 }, "(0)"));
	it('should interpolate true as string', testRender("({{true}})", { true: true }, "(true)"));
	it('should interpolate false as string', testRender("({{false}})", { false: false }, "(false)"));

	it('should treat string as boolean true in section', testRender("{{#string}}yes{{/string}}", { string: "true" }, "yes"));
	it('should treat string as boolean true in negative section', testRender("{{^string}}no{{/string}}", { string: "true" }, ""));
});
