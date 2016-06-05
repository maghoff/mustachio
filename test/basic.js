'use strict';

const mustachio = require('../');
const chai = require('chai');

const assert = chai.assert;

describe('render', function() {
	it('should not interpolate a simple string', function () {
		assert.equal("apekatt", mustachio.render("apekatt", {}));
	});

	it('should manage lots of empty interpolations', function () {
		assert.equal("apekatt", mustachio.render("ap{{}}ek{{}}at{{}}t", {}));
	});

	it('should complain about unclosed tag', function () {
		chai.expect(() => mustachio.render("ape{{katt", {})).to.throw();
	});

	it('should interpolate', function () {
		assert.equal("apekatt", mustachio.render("ape{{dyr}}", { dyr: "katt" }));
		assert.equal("apekatt!", mustachio.render("ape{{dyr}}!", { dyr: "katt" }));
	});
});
