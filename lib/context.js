'use strict';

function Context(data, partials, parent) {
	this.data = data;
	this.partials = partials;
	this.parent = parent;
}

Context.prototype.get = function (id) {
	if (this.data.hasOwnProperty(id)) return this.data[id];
	else if (this.parent) return this.parent.get(id);
};

Context.prototype.getPartial = function (id) {
	return this.partials.get(id);
};

Context.prototype.subcontext = function (data) {
	return new Context(data, this.partials, this);
};

module.exports = Context;
