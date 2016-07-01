'use strict';

const fs = require('fs');
const path = require('path');
const parser = require('./parser');

function InMemoryPartials(partials) {
	this.partials = partials;
	this.compiledPartials = {};
}

InMemoryPartials.prototype.get = function (id) {
	if (this.compiledPartials.hasOwnProperty(id)) return this.compiledPartials[id];
	if (this.partials.hasOwnProperty(id)) {
		return this.compiledPartials[id] = parser(this.partials[id]);
	}
	return null;
};


function FsPartials(root, suffixes) {
	this.root = root || path.join(path.dirname(require.main.filename), 'templates');
	this.suffixes = suffixes || [ '.mustache', '.mu', '.mu.html', '.html' ];
	this.compiledPartials = {};
}

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

FsPartials.prototype.get = function (id) {
	if (this.compiledPartials.hasOwnProperty(id)) return this.compiledPartials[id];

	const basename = path.join(this.root, id);
	return this.compiledPartials[id] = Promise.all(
		this.suffixes.map(suffix => tryFile(basename+suffix))
	).then(candidates => {
		candidates = candidates.filter(x => !!x);
		if (!candidates.length) {
			throw Error(`Partial ${JSON.stringify(id)} not found. (Searching in ` +
				`${this.root} with suffixes ${JSON.stringify(this.suffixes)})`);
		}

		const stream = candidates[0];

		return new Promise((resolve, reject) => {
			const buf = [];
			stream.on('data', chunk => buf.push(chunk));
			stream.on('end', () => resolve(buf.join('')));
			stream.on('error', reject);
		}).then(src => this.compiledPartials[id] = parser(src));
	});
};


module.exports = {
	InMemoryPartials,
	FsPartials,
};
