'use strict';

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

module.exports = {
	InMemoryPartials
};
