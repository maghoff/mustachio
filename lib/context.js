'use strict';

function Context() {
}

Context.createRoot = function (data, partials, margin) {
	const root = new Context();

	root.data = resolveData(data, []);
	root.resolved = !(root.data instanceof Promise);

	if (!root.resolved) {
		root.data.then(resolvedData => {
			root.data = resolvedData;
			root.resolved = true;
		});
	}

	root.partials = partials;
	root.margin = "";

	root.parent = null;

	return root;
}

Context.prototype.get = function (id) {
	if (this.data[id] !== undefined) return this.data[id];
	else if (this.parent) return this.parent.get(id);
};

Context.prototype.getPartial = function (id) {
	return this.partials.get(id);
};

Context.prototype.withScope = function (data) {
	const subcontext = new Context();
	subcontext.data = data;
	subcontext.parent = this;
	subcontext.resolved = true;
	subcontext.partials = this.partials;
	subcontext.margin = this.margin;
	return subcontext;
};

Context.prototype.withMargin = function (margin) {
	const subcontext = new Context();
	subcontext.data = this.data;
	subcontext.parent = this.parent;
	subcontext.resolved = true;
	subcontext.partials = this.partials;
	subcontext.margin = this.margin + margin;
	return subcontext;
};


function resolveData(data, path, parent) {
	if (data == null) return null;

	if (typeof data === 'function') return resolveData(data.call(parent), path, parent);

	if (data instanceof Promise) {
		return data.then(result => resolveData(result, path, parent));
	}

	if (path.length === 0) return data;
	return resolveData(data[path[0]], path.slice(1), data);
}

Context.prototype.resolveInContext = function (path) {
	if (path.length === 0) return resolveData(this.data, [], null);
	else return resolveData(this.get(path[0]), path.slice(1), this.data);
}

Context.prototype.resolve = function (path) {
	if (this.resolved) return this.resolveInContext(path);
	else return this.data.then(() => this.resolveInContext(path));
};


module.exports = Context;
