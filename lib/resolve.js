'use strict';

function resolveData(data, path, parent) {
	if (data == null) return null;

	if (typeof data === 'function') return resolveData(data.call(parent), path);

	if (path.length === 0) return data;
	return resolveData(data[path[0]], path.slice(1), data);
}

function resolveInContext(context, path) {
	if (path.length === 0) return resolveData(context.data, [], null);
	else return resolveData(context.get(path[0]), path.slice(1), context.data);
}

module.exports = resolveInContext;
