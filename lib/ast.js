'use strict';

const escape = require('./html').escape;
const resolve = require('./resolve');

function stringify(value) {
	if (typeof value === 'number') return "" + value;
	if (!value) return "";
	return "" + value;
}

function LineStart(str) { this.str = str; }
LineStart.prototype.render = function* (context) {
	if (context.margin) yield context.margin;
}

function Literal(str) { this.str = str; }
Literal.prototype.render = function* (_context) { yield this.str; }

function Interpolation(path, verbatim) {
	this.path = path;
	this.verbatim = verbatim;
}

Interpolation.prototype.render = function* (context) {
	const maybeResolved = resolve(context, this.path);
	const resolved = stringify((maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved);

	if (this.verbatim) yield resolved;
	else yield* escape(resolved);
}

function Sequence(seq) { this.seq = seq; }

Sequence.prototype.render = function* (context) {
	for (const item of this.seq) {
		yield* item.render(context);
	}
};

function Section(path, nested) {
	this.path = path;
	this.nested = nested;
}
Section.prototype.render = function* (context) {
	const maybeResolved = resolve(context, this.path);
	const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

	if (!value) return;

	if (value[Symbol.iterator] && !(typeof value === 'string')) {
		for (const item of value) {
			const maybeResolved = resolve(context.subcontext(item), []);
			const element = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;
			yield* this.nested.render(context.subcontext(element));
		}
	} else if (typeof value === 'object') {
		yield* this.nested.render(context.subcontext(value));
	} else {
		yield* this.nested.render(context.subcontext({ ".": value }));
	}
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

module.exports = {
	LineStart,
	Literal,
	Interpolation,
	Sequence,
	Section,
	NegativeSection,
	Partial
};
