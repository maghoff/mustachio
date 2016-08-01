'use strict';

const isStream = require('is-stream');
const escape = require('./html').escape;
const resolve = require('./resolve');

function stringify(value) {
	if (typeof value === 'number') return "" + value;
	if (!value) return "";
	return "" + value;
}

function* consumeStream(stream, handler) {
	let resolvePromise = null;
	let rejectPromise = null;
	let end = false;

	const readableListener = () => resolvePromise();
	const errorListener = err => rejectPromise(err);
	stream.on('readable', readableListener);
	stream.on('end', () => { end = true; readableListener(); });
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
	stream.removeListener('end', readableListener);
	stream.removeListener('readable', readableListener);
}

function LineStart(str) { this.str = str; }
LineStart.prototype.render = function* (context) {
	if (context.margin) yield context.margin;
}
LineStart.prototype.generateCode = function () {
	return "if (context.margin) yield context.margin;";
}

function Literal(str) { this.str = str; }
Literal.prototype.render = function* (_context) { yield this.str; }
Literal.prototype.generateCode = function () { return `yield ${JSON.stringify(this.str)};`; }

function Interpolation(path, verbatim) {
	this.path = path;
	this.verbatim = verbatim;
}

Interpolation.prototype.render = function* (context) {
	const maybeResolved = resolve(context, this.path);
	const resolved = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

	if (isStream.readable(resolved)) {
		yield* consumeStream(resolved, chunk => {
			if (this.verbatim) return [chunk];
			else return escape(chunk);
		});
	} else {
		if (this.verbatim) yield stringify(resolved);
		else yield* escape(stringify(resolved));
	}
}

Interpolation.prototype.generateCode = function () {
	return `{
		const maybeResolved = resolve(context, ${JSON.stringify(this.path)});
		const resolved = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

		if (isStream.readable(resolved)) {
			yield* consumeStream(resolved, chunk => ${
				this.verbatim ?
					"[chunk]" :
					"escape(chunk)"
			});
		} else {
			${this.verbatim ?
				"yield stringify(resolved);" :
				"yield* escape(stringify(resolved));"
			}
		}
	}`;
}

function Sequence(seq) { this.seq = seq; }

Sequence.prototype.render = function* (context) {
	for (const item of this.seq) {
		yield* item.render(context);
	}
};

Sequence.prototype.generateCode = function (defun) {
	const code = [];
	for (const item of this.seq) {
		code.push(item.generateCode(defun));
	}
	return code.join('\n');
};

function Section(path, nested) {
	this.path = path;
	this.nested = nested;
}
// Section.prototype.render = function* (context) {
// 	const maybeResolved = resolve(context, this.path);
// 	const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;
//
// 	if (!value) return;
//
// 	if (value[Symbol.iterator] && !(typeof value === 'string')) {
// 		for (const item of value) {
// 			const maybeResolved = resolve(context.subcontext(item), []);
// 			const element = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;
// 			yield* this.nested.render(context.subcontext(element));
// 		}
// 	} else if (isStream.readable(value)) {
// 		if (value._readableState.objectMode) {
// 			yield* consumeStream(value, (item) => this.nested.render(context.subcontext(item)));
// 		}
// 	} else if (typeof value === 'object') {
// 		yield* this.nested.render(context.subcontext(value));
// 	} else {
// 		yield* this.nested.render(context.subcontext({ ".": value }));
// 	}
// };
function* resolveYieldPromiseThing(value, nested, context) {
	for (const item of value) {
		const maybeResolved = resolve(context.subcontext(item), []);
		const element = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;
		yield* nested(context.subcontext(element));
	}
}
function renderSection(value, nested, context) {
	if (!value) return [];

	if (value[Symbol.iterator] && !(typeof value === 'string')) {
		return resolveYieldPromiseThing(value, nested, context);
	} else if (isStream.readable(value)) {
		if (value._readableState.objectMode) {
			return consumeStream(value, item => nested(context.subcontext(item)));
		} else {
			return [];
		}
	} else if (typeof value === 'object') {
		return nested(context.subcontext(value));
	} else {
		return nested(context.subcontext({ ".": value }));
	}
}
Section.prototype.render = function* (context) {
	const maybeResolved = resolve(context, this.path);
	const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

	yield* renderSection(value, ctx => this.nested.render(ctx), context);
};
Section.prototype.generateCode = function (defun) {
	const nested = defun(this.nested.generateCode(defun));
	return `{
	const maybeResolved = resolve(context, ${JSON.stringify(this.path)});
	const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

	yield* renderSection(value, ${nested}, context);
	}`;
};

function NegativeSection(path, nested) {
	this.path = path;
	this.nested = nested;
}
NegativeSection.prototype.render = function* (context) {
	const maybeResolved = resolve(context, this.path);
	const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

	if (Array.isArray(value) && value.length) return;
	if (!Array.isArray(value) && value) return;

	yield* this.nested.render(context);
};
NegativeSection.prototype.generateCode = function (defun) {
	return `{
	const maybeResolved = resolve(context, ${JSON.stringify(this.path)});
	const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

	do {
		if (Array.isArray(value) && value.length) break;
		if (!Array.isArray(value) && value) break;

		${this.nested.generateCode(defun)}
	} while(false);
	}`;
};

function Partial(partialName, margin) {
	this.partialName = partialName;
	this.margin = margin;
}
Partial.prototype.render = function* (context) {
	const unresolvedPartial = context.getPartial(this.partialName);
	if (!unresolvedPartial) return;
	const partial = (unresolvedPartial instanceof Promise) ? yield unresolvedPartial : unresolvedPartial;

	const subcontext = context.subcontext({});
	subcontext.margin = (context.margin || "") + (this.margin || "");

	// TODO: Something about paths for partials

	yield* partial.render(subcontext);
};
Partial.prototype.generateCode = function () {
	return `{
	const unresolvedPartial = context.getPartial(${JSON.stringify(this.partialName)});
	const partial = (unresolvedPartial instanceof Promise) ? yield unresolvedPartial : unresolvedPartial;
	if (partial) {
		const subcontext = context.subcontext({});
		subcontext.margin = (context.margin || "") + (${JSON.stringify(this.margin || "")});

		yield* partial(subcontext);
	}
	}`;
};

module.exports = {
	LineStart,
	Literal,
	Interpolation,
	Sequence,
	Section,
	NegativeSection,
	Partial,
	consumeStream,
	renderSection,
	stringify
};
