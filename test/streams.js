'use strict';

const mustachio = require('../');
const chai = require('chai');
const stream = require('stream');
const readableStream = require('readable-stream');
const util = require('./util');
const testRender = util.testRender;

function streamReadable(str) {
	return new stream.Readable({
		read(size) {
			this.push(str);
			this.push(null);
		},
		encoding: 'utf-8'
	});
}

function readableStreamReadable(str) {
	return new readableStream.Readable({
		read(size) {
			this.push(str);
			this.push(null);
		},
		encoding: 'utf-8'
	});
}

describe('streams', function() {
	it('should handle stream.Readable as stream', testRender(
		"ape{{{stream}}}katt", { stream: streamReadable("<monkey>") }, "ape<monkey>katt"));

	it('should handle readableStream.Readable as stream', testRender(
		"ape{{{stream}}}katt", { stream: readableStreamReadable("<monkey>") }, "ape<monkey>katt"));

	it('should escape stream', testRender(
		"ape{{stream}}katt", { stream: streamReadable("<monkey>") }, "ape&lt;monkey&gt;katt"));
});
