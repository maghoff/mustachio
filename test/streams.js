'use strict';

const mustachio = require('../');
const chai = require('chai');
const stream = require('stream');
const readableStream = require('readable-stream');
const util = require('./util');
const testRender = util.testRender, expectError = util.expectError;

function streamOpts(str) {
	return {
		read(size) {
			this.push(str);
			this.push(null);
		},
		encoding: 'utf-8'
	};
}

function streamReadable(str) {
	return new stream.Readable(streamOpts(str));
}

function readableStreamReadable(str) {
	return new readableStream.Readable(streamOpts(str));
}

function errorStream() {
	return new stream.Readable({
		read(size) {
			process.nextTick(() => this.emit('error', new Error('Expected error')));
		},
		encoding: 'utf-8'
	});
}

function objectStream(objects) {
	return new stream.Readable({
		objectMode: true,
		read(sz) {
			this.push(objects.length ? objects.shift() : null);
		}
	});
}

describe('streams', function () {
	describe('interpolation', function () {
		it('should handle stream.Readable as stream', testRender(
			"ape{{{stream}}}katt", { stream: streamReadable("<monkey>") }, "ape<monkey>katt"));

		it('should handle readableStream.Readable as stream', testRender(
			"ape{{{stream}}}katt", { stream: readableStreamReadable("<monkey>") }, "ape<monkey>katt"));

		it('should escape stream', testRender(
			"ape{{stream}}katt", { stream: streamReadable("<monkey>") }, "ape&lt;monkey&gt;katt"));

		it('should propagate error', expectError("{{stream}}", { stream: errorStream() }));
	});

	describe('iteration', function () {
		it('should iterate over stream in object mode', testRender(
			"[{{#stream}}{{key}}: {{value}}\n{{/stream}}]",
			{ stream: objectStream([{key: 'a', value: 1}, {key: 'b', value: 2}]) },
			"[a: 1\nb: 2\n]"));

		it('should ignore non-object mode stream', testRender(
			"[{{#stream}}{{key}}: {{value}}\n{{/stream}}]", { stream: streamReadable("<monkey>") }, "[]"));
	});
});
