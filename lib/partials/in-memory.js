'use strict';

const compile = require('../compiler').compile;

function findPartial(partials, path) {
	if (path.length === 0) return partials;

	const head = path[0];
	const tail = path.slice(1);
	if (!partials.hasOwnProperty(head)) return null;
	return findPartial(partials[head], tail);
}

function InMemory(partials) {
	this.partials = partials;
	this.compiledPartials = {};
}

InMemory.prototype.get = function (id) {
	if (this.compiledPartials.hasOwnProperty(id)) return this.compiledPartials[id];

	const partial = findPartial(this.partials, id.split('/'));
	if (!partial) return null;

	return this.compiledPartials[id] = compile(partial);
};

module.exports = InMemory;
