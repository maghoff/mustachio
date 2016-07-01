'use strict';

const parser = require('../parser');

function InMemory(partials) {
	this.partials = partials;
	this.compiledPartials = {};
}

InMemory.prototype.get = function (id) {
	if (this.compiledPartials.hasOwnProperty(id)) return this.compiledPartials[id];
	if (this.partials.hasOwnProperty(id)) {
		return this.compiledPartials[id] = parser(this.partials[id]);
	}
	return null;
};

module.exports = InMemory;
