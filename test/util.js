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

function expectError(template, data) {
	return done => {
		mustachio.string(template).render(data).string().then(actual => {
			done(new Error("Expected exception"));
		}).catch(err => done());
	};
}

module.exports = {
	testRender,
	expectError,
};
