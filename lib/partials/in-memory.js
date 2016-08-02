'use strict';

const parser = require('../parser');

function InMemory(partials) {
	this.partials = partials;
	this.compiledPartials = {};
}

InMemory.prototype.get = function (id) {
	const compileTemplate = require('../../').compileTemplate;

	if (this.compiledPartials.hasOwnProperty(id)) return this.compiledPartials[id];
	if (this.partials.hasOwnProperty(id)) {
		return this.compiledPartials[id] = compileTemplate(parser(this.partials[id]));
	}
	return null;
};

module.exports = InMemory;
