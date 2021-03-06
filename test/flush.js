'use strict';

const mustachio = require('../');
const chai = require('chai');
const util = require('./util');

const assert = chai.assert;

describe('_flush', function () {
	it('should flush when told to', function (done) {
		const template = "ape{{_flush}}katt";
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
		const template = "a{{_flush}}pe{{_flush}}ka{{_flush}}tt";
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
		const template = "ape{{_flush}}katt";
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
		const template = "ape{{_flush}}katt";
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

describe('stream.flush()', function () {
	it('should flush when told to', function (done) {
		const template = "ape{{feline}}!";
		const expectedChunks = [ "ape", "katt!" ];

		let stream;
		const data = {
			feline: () => stream.flush().then(() => "katt")
		};
		stream = mustachio.string(template).render(data).stream();
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
