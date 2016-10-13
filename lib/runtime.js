'use strict';

const isStream = require('is-stream');

function stringify(value) {
	if (value == null) return "";
	return "" + value;
}

function* consumeStream(stream, handler) {
	let resolvePromise = null;
	let rejectPromise = null;
	let end = false;

	const readableListener = () => resolvePromise();
	const endListener = () => { end = true; readableListener(); };
	const errorListener = err => rejectPromise(err);
	stream.on('readable', readableListener);
	stream.on('end', endListener);
	stream.on('error', errorListener);

	while (!end) {
		yield new Promise((resolve, reject) => {
			resolvePromise = resolve;
			rejectPromise = reject;
		});

		while (!end) {
			const chunk = stream.read();

			if (chunk === null) break;
			yield* handler(chunk);
		}
	}

	stream.removeListener('error', errorListener);
	stream.removeListener('end', endListener);
	stream.removeListener('readable', readableListener);
}

function* renderIterableSection(iterable, nested, context) {
	for (const item of iterable) {
		const maybeResolved = context.withScope(item).resolve([]);
		const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;
		yield* nested(context.withScope(value));
	}
}

function renderSection(value, nested, context) {
	if (!value) return [];

	if (value[Symbol.iterator] && !(typeof value === 'string')) {
		return renderIterableSection(value, nested, context);
	} else if (isStream.readable(value)) {
		if (value._readableState.objectMode) {
			return consumeStream(value, item => nested(context.withScope(item)));
		} else {
			return [];
		}
	} else if (typeof value === 'object') {
		return nested(context.withScope(value));
	} else {
		return nested(context.withScope({ ".": value }));
	}
}


module.exports = {
	stringify,
	consumeStream,
	renderSection,
};
