'use strict';

function resolveData(data, path) {
	if (data == null) return null;

	if (typeof data === 'function') return resolveData(data(), path);

	if (path.length === 0) return data;
	return resolveData(data[path[0]], path.slice(1));
}

function resolveInContext(context, path) {
	if (path.length === 0) return resolveData(context.data, []);
	else return resolveData(context.get(path[0]), path.slice(1));
}

module.exports = resolveInContext;
