'use strict';

const fs = require('fs');
const path = require('path');
const compile = require('../compiler').compile;

const DEFAULT_SUFFIXES = [ '.mustache', '.mu', '.mu.html', '.html' ];

class PartialNotFoundError extends Error {};

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
		if (!candidates.length) throw new PartialNotFoundError();

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
		.then(compile)
		.catch(err => {
			if (err instanceof PartialNotFoundError) return null;
			throw err;
		})
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

Fs.prototype.purge = function (id) {
	delete this.compiledPartials[id];
};


function FsWatch(root, suffixes) {
	this.root = root || path.join(path.dirname(require.main.filename), 'templates');
	this.suffixes = suffixes || DEFAULT_SUFFIXES;
	this.fs = new Fs(this.root, this.suffixes);
	this.watchers = {};
}

FsWatch.prototype.get = function (id) {
	if (!this.watchers.hasOwnProperty(id)) {
		this.watchers[id] = this.suffixes.map(
			suffix => {
				try {
					return fs.watch(
						path.join(this.root, id + suffix),
						{ persistent: false },
						() => this.purge(id))
				}
				catch (err) {}
			})
			.filter(x => !!x);
	}

	return this.fs.get(id);
};

FsWatch.prototype.purge = function (id) {
	this.watchers[id].forEach(watcher => watcher.close());
	delete this.watchers[id];
	this.fs.purge(id);
};


module.exports = {
	FsNoCache,
	Fs,
	FsWatch,
};
