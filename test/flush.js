'use strict';

const mustachio = require('../');
const chai = require('chai');
const util = require('./util');

const assert = chai.assert;

describe('flush', function () {
	it('should flush when told to', function (done) {
		const template = "ape{{mu_flush}}katt";
		const expectedChunks = [ "ape", "katt" ];

		const stream = mustachio.string(template).render({}).stream();
		stream.on('data', chunk => {
			assert.equal(expectedChunks.shift(), chunk);
		});
		stream.on('end', () => {
			assert.equal(0, expectedChunks.length);
			done();
		});
		stream.on('error', done);
	});

	it('should handle multiple flushes', function (done) {
		const template = "a{{mu_flush}}pe{{mu_flush}}ka{{mu_flush}}tt";
		const expectedChunks = [ "a", "pe", "ka", "tt" ];

		const stream = mustachio.string(template).render({}).stream();
		stream.on('data', chunk => {
			assert.equal(expectedChunks.shift(), chunk);
		});
		stream.on('end', () => {
			assert.equal(0, expectedChunks.length);
			done();
		});
		stream.on('error', done);
	});

	it('should be able to flush when root data object is a function', function (done) {
		const template = "ape{{mu_flush}}katt";
		const expectedChunks = [ "ape", "katt" ];

		const stream = mustachio.string(template).render(() => ({})).stream();
		stream.on('data', chunk => {
			assert.equal(expectedChunks.shift(), chunk);
		});
		stream.on('end', () => {
			assert.equal(0, expectedChunks.length);
			done();
		});
		stream.on('error', done);
	});

	it('should be able to flush when root data object is a promise', function (done) {
		const template = "ape{{mu_flush}}katt";
		const expectedChunks = [ "ape", "katt" ];

		const stream = mustachio.string(template).render(Promise.resolve({})).stream();
		stream.on('data', chunk => {
			assert.equal(expectedChunks.shift(), chunk);
		});
		stream.on('end', () => {
			assert.equal(0, expectedChunks.length);
			done();
		});
		stream.on('error', done);
	});
});
