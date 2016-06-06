'use strict';

function Literal(str) { this.str = str; }
Literal.prototype.render = function* (data) { yield this.str; }

function Interpolation(name, verbatim) {
	this.name = name;
	this.verbatim = verbatim;
}

Interpolation.prototype.render = function* (data) {
	const resolved = "" + (data[this.name] || "");
	if (this.verbatim) yield resolved;
	else yield* escape(resolved);
}

function* escape(str) {
	var i = 0;
	while (i < str.length) {
		var j = str.slice(i).search(/[&<>"']/) + i;
		if (j === -1) {
			yield str.slice(i);
			return;
		}
		if (j !== i) yield str.slice(i, j);
		switch (str[j]) {
			case '&': yield '&amp;'; break;
			case '<': yield '&lt;'; break;
			case '>': yield '&gt;'; break;
			case '"': yield '&quot;'; break;
			case "'": yield '&apos;'; break;
		}
		i = j+1;
	}
}

function* parse(str) {
	var openDelimiter = '{{';
	var closeDelimiter = '}}';

	var i = 0;
	while (i < str.length) {
		const openPos = str.indexOf(openDelimiter, i);

		if (openPos === -1) {
			yield new Literal(str.slice(i));
			break;
		}

		if (openPos > i) {
			yield new Literal(str.slice(i, openPos));
		}

		i = openPos + openDelimiter.length;

		if (i >= str.length) throw new Error("Mustache tag opened without being closed");

		var expectedCloseDelimiter = closeDelimiter;

		var fn = str[i];

		switch (str[i]) {
		case '{': expectedCloseDelimiter = '}' + closeDelimiter; break;
		case '=': expectedCloseDelimiter = '=' + closeDelimiter; break;
		}

		if (fn.match(/[{&=<#/]/)) i++;
		else fn = '';

		const closePos = str.indexOf(expectedCloseDelimiter, i);
		if (closePos === -1) throw new Error("Mustache tag opened without being closed");

		const tagContents = str.slice(i, closePos).trim();

		switch (fn) {
		case '': yield new Interpolation(tagContents); break;
		case '{':
		case '&':
			yield new Interpolation(tagContents, true); break;
		}

		i = closePos + expectedCloseDelimiter.length;
	}
}

function* generate(template, data) {
	for (var x = template.next(); !x.done; x = template.next()) {
		yield* x.value.render(data);
	}
}

function render(template, data) {
	var g = generate(parse(template), data);

	var bufs = [];
	for (var x = g.next(); !x.done; x = g.next()) {
		bufs.push(x.value);
	}

	return bufs.join('');
}

module.exports = {
	parse,
	render
};
