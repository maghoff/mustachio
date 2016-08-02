'use strict';

function Context(data, partials, margin) {
	this.data = data;
	this.partials = partials;
	this.margin = margin;

	this.parent = null;
}

Context.prototype.get = function (id) {
	if (this.data[id] !== undefined) return this.data[id];
	else if (this.parent) return this.parent.get(id);
};

Context.prototype.getPartial = function (id) {
	return this.partials.get(id);
};

Context.prototype.subcontext = function (data) {
	const subcontext = new Context(data, this.partials, this.margin);
	subcontext.parent = this;
	return subcontext;
};

module.exports = Context;
