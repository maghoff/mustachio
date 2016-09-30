'use strict';

const mustachio = require('../');
const path = require('path');
const chai = require('chai');
const util = require('./util');
const testRender = util.testRender;

const assert = chai.assert;

describe('resolver', function() {
	describe('string', function() {
		it('should produce output', () => {
			const mu = mustachio.resolver({ root: path.join(__dirname, 'partials') });
			return mu("apekatt", {}).string()
				.then(actual => {
					assert.equal("apekatt\n", actual);
				});
		});
	});

	describe('stream', function() {
		it('should render to completion', done => {
			const mu = mustachio.resolver({ root: path.join(__dirname, 'partials') });
			const stream = mu("apekatt", {}).stream();
			stream.on('data', chunk => { assert.equal("apekatt\n", chunk); });
			stream.on('end', done);
			stream.on('error', done);
		});
	});
});
