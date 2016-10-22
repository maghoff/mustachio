'use strict';

const path = require('path');

function LineStart(str) { this.str = str; }
LineStart.prototype.generateCode = function () { return "context.margin"; }
LineStart.prototype.generateCodeInline = true;

function Literal(str) { this.str = str; }
Literal.prototype.generateCode = function () { return JSON.stringify(this.str); }
Literal.prototype.generateCodeInline = true;

function Interpolation(path, verbatim) {
	this.path = path;
	this.verbatim = verbatim;
}

Interpolation.prototype.generateCode = function (defun, define) {
	return `{
		const maybeResolved = context.resolve(${define(this.path)});
		const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

		if (isStream.readable(value)) {
			yield* consumeStream(value, chunk => ${this.verbatim ? "[chunk]" : "escape(chunk)"});
		} else {
			yield ${this.verbatim ? "stringify(value)" : "* escape(stringify(value))"};
		}
	}`;
};
Interpolation.prototype.generateCodeInline = false;

function Sequence(seq) { this.seq = seq; }

Sequence.prototype.generateCode = function (defun, define) {
	const code = [];
	const inlines = [];
	for (const item of this.seq) {
		if (item.generateCodeInline) {
			inlines.push(item.generateCode(defun, define));
		} else {
			if (inlines.length) {
				code.push(`yield ${inlines.join('+')};`);
				inlines.length=0;
			}
			code.push(item.generateCode(defun, define));
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
Section.prototype.generateCode = function (defun, define) {
	const nested = defun(this.nested.generateCode(defun, define));
	return `{
		const maybeResolved = context.resolve(${define(this.path)});
		const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

		yield* renderSection(value, ${nested}, context);
	}`;
};
Section.prototype.generateCodeInline = false;

function NegativeSection(path, nested) {
	this.path = path;
	this.nested = nested;
}
NegativeSection.prototype.generateCode = function (defun, define) {
	return `{
		const maybeResolved = context.resolve(${define(this.path)});
		const value = (maybeResolved instanceof Promise) ? (yield maybeResolved) : maybeResolved;

		do {
			if (Array.isArray(value) && value.length) break;
			if (!Array.isArray(value) && value) break;

			${this.nested.generateCode(defun, define)}
		} while(false);
	}`;
};
NegativeSection.prototype.generateCodeInline = false;

function Partial(partialName, margin) {
	this.partialName = partialName;
	this.margin = margin;
}
Partial.prototype.generateCode = function (defun, define) {
	let nestedContext = 'context';

	if (this.margin) {
		nestedContext = `${nestedContext}.withMargin(${define(this.margin)})`;
	}

	const partialDir = path.dirname(this.partialName);
	if (partialDir !== '.') {
		nestedContext = `${nestedContext}.withPartialPath(${define(partialDir)})`;
	}

	return `{
		const unresolvedPartial = context.getPartial(${define(this.partialName)});
		const partial = (unresolvedPartial instanceof Promise) ? yield unresolvedPartial : unresolvedPartial;
		if (partial) yield* partial(${nestedContext});
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
};
