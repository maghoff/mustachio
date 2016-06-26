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
	const resolved = stringify(yield resolve(context, this.path));
	if (this.verbatim) yield resolved;
	else yield* escape(resolved);
}

function Sequence(seq) { this.seq = seq; }

Sequence.prototype.render = function* (context) {
	for (var i = 0; i < this.seq.length; ++i) {
		yield* this.seq[i].render(context);
	}
};

function Section(path, nested) {
	this.path = path;
	this.nested = nested;
}
Section.prototype.render = function* (context) {
	const value = yield resolve(context, this.path);

	if (!value) return;

	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; ++i) {
			yield* this.nested.render(context.subcontext(value[i]));
		}
	} else if (typeof value.next === 'function') {
		for (;;) {
			const it = value.next();
			if (it.done) break;
			yield* this.nested.render(context.subcontext(it.value));
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
	const value = yield resolve(context, this.path);

	if (Array.isArray(value) && value.length) return;
	if (!Array.isArray(value) && value) return;

	yield* this.nested.render(context);
};

function Partial(partialName, margin) {
	this.partialName = partialName;
	this.margin = margin;
}
Partial.prototype.render = function* (context) {
	var partial = context.getPartial(this.partialName);
	if (!partial) return;

	const subcontext = context.subcontext({});
	subcontext.margin = (context.margin || "") + (this.margin || "");

	// TODO Partial resolving should be in another abstraction. Context, maybe?
	const parser = require('./parser');
	yield* parser(partial).render(subcontext);
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
