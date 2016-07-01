'use strict';

const fs = require('fs');
const path = require('path');
const parser = require('../parser');

const DEFAULT_SUFFIXES = [ '.mustache', '.mu', '.mu.html', '.html' ];

function tryFile(filename) {
	return new Promise((resolve, reject) => {
		const stream = fs.createReadStream(filename, { encoding: 'utf8' });

		const errorHandler = () => resolve(null);
		stream.on('error', errorHandler);

		stream.once('open', () => {
			stream.removeListener('error', errorHandler);
			resolve(stream);
		});
	});
}

function openPartial(root, id, suffixes) {
	const basename = path.join(root, id);

	return Promise.all(
		suffixes.map(suffix => tryFile(basename+suffix))
	).then(candidates => {
		candidates = candidates.filter(x => !!x);
		if (!candidates.length) {
			throw Error(`Partial ${JSON.stringify(id)} not found. (Searching in ` +
				`${root} with suffixes ${JSON.stringify(suffixes)})`);
		}

		return candidates[0];
	});
}

function bufferStream(stream) {
	return new Promise((resolve, reject) => {
		const buf = [];
		stream.on('data', chunk => buf.push(chunk));
		stream.on('end', () => resolve(buf.join('')));
		stream.on('error', reject);
	});
}


function FsNoCache(root, suffixes) {
	this.root = root || path.join(path.dirname(require.main.filename), 'templates');
	this.suffixes = suffixes || DEFAULT_SUFFIXES;
}

FsNoCache.prototype.get = function (id) {
	return openPartial(this.root, id, this.suffixes)
		.then(bufferStream)
		.then(parser);
};


function Fs(root, suffixes) {
	this.fs = new FsNoCache(root, suffixes);
	this.compiledPartials = {};
}

Fs.prototype.get = function (id) {
	if (this.compiledPartials.hasOwnProperty(id)) return this.compiledPartials[id];

	return this.compiledPartials[id] = this.fs.get(id)
		.then(partial => this.compiledPartials[id] = partial);
};


module.exports = {
	Fs,
	FsNoCache,
};
