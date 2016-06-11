'use strict';

function Context(data, parent, partials) {
	this.data = data;
	this.parent = parent;
	this.partials = partials;
}

Context.prototype.get = function (id) {
	if (this.data.hasOwnProperty(id)) return this.data[id];
	else if (this.parent) return this.parent.get(id);
};

Context.prototype.getPartial = function (id) {
	if (this.partials && this.partials.hasOwnProperty(id)) return this.partials[id];
	else if (this.parent) return this.parent.getPartial(id);
};

Context.prototype.subcontext = function (data) {
	return new Context(data, this);
};

module.exports = Context;
