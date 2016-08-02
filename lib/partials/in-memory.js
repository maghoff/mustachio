'use strict';

const parser = require('../parser');
const compiler = require('../compiler');

function InMemory(partials) {
	this.partials = partials;
	this.compiledPartials = {};
}

InMemory.prototype.get = function (id) {
	if (this.compiledPartials.hasOwnProperty(id)) return this.compiledPartials[id];
	if (this.partials.hasOwnProperty(id)) {
		return this.compiledPartials[id] = compiler(parser(this.partials[id]));
	}
	return null;
};

module.exports = InMemory;
