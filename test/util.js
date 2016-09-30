'use strict';

const mustachio = require('../');
const chai = require('chai');
const assert = chai.assert;

function testRender(template, data, expected) {
	return () =>
		mustachio.string(template).render(data).string().then(actual => {
			assert.equal(expected, actual);
		});
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
