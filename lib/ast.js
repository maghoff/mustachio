'use strict';

const isStream = require('is-stream');
const escape = require('./html').escape;
const resolve = require('./resolve');

function stringify(value) {
	if (value == null) return "";
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

function* renderIterableSection(iterable, nested, context) {
	for (const item of iterable) {
		const maybeResolved = resolve(context.subcontext(item), []);
		const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;
		yield* nested(context.subcontext(value));
	}
}

function renderSection(value, nested, context) {
	if (!value) return [];

	if (value[Symbol.iterator] && !(typeof value === 'string')) {
		return renderIterableSection(value, nested, context);
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


function LineStart(str) { this.str = str; }
LineStart.prototype.generateCode = function () {
	return "context.margin";
}
LineStart.prototype.generateCodeInline = true;

function Literal(str) { this.str = str; }
Literal.prototype.generateCode = function () { return JSON.stringify(this.str); }
Literal.prototype.generateCodeInline = true;

function Interpolation(path, verbatim) {
	this.path = path;
	this.verbatim = verbatim;
}

Interpolation.prototype.generateCode = function () {
	return `{
		const maybeResolved = resolve(context, ${JSON.stringify(this.path)});
		const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

		if (isStream.readable(value)) {
			yield* consumeStream(value, chunk => ${this.verbatim ? "[chunk]" : "escape(chunk)"});
		} else {
			yield ${this.verbatim ? "stringify(value)" : "* escape(stringify(value))"};
		}
	}`;
}
Interpolation.prototype.generateCodeInline = false;

function Sequence(seq) { this.seq = seq; }

Sequence.prototype.generateCode = function (defun) {
	const code = [];
	const inlines = [];
	for (const item of this.seq) {
		if (item.generateCodeInline) {
			inlines.push(item.generateCode());
		} else {
			if (inlines.length) {
				code.push(`yield ${inlines.join('+')};`);
				inlines.length=0;
			}
			code.push(item.generateCode(defun));
		}
	}
	if (inlines.length) {
		code.push(`yield ${inlines.join('+')};`);
	}
	return code.join('\n');
};
Sequence.prototype.generateCodeInline = false;

function Section(path, nested) {
	this.path = path;
	this.nested = nested;
}
Section.prototype.generateCode = function (defun) {
	const nested = defun(this.nested.generateCode(defun));
	return `{
		const maybeResolved = resolve(context, ${JSON.stringify(this.path)});
		const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

		yield* renderSection(value, ${nested}, context);
	}`;
};
Section.prototype.generateCodeInline = false;

function NegativeSection(path, nested) {
	this.path = path;
	this.nested = nested;
}
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
NegativeSection.prototype.generateCodeInline = false;

function Partial(partialName, margin) {
	this.partialName = partialName;
	this.margin = margin;
}
Partial.prototype.generateCode = function () {
	// TODO: Something about paths for partials
	return `{
		const unresolvedPartial = context.getPartial(${JSON.stringify(this.partialName)});
		const partial = (unresolvedPartial instanceof Promise) ? yield unresolvedPartial : unresolvedPartial;
		if (partial) {
			const subcontext = context.subcontext({});
			subcontext.margin = context.margin + ${JSON.stringify(this.margin || "")};

			yield* partial(subcontext);
		}
	}`;
};
Partial.prototype.generateCodeInline = false;

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
