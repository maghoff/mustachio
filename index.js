'use strict';

function Literal(str) { this.str = str; }
Literal.prototype.render = function (data) { return this.str; }

function Interpolation(name) { this.name = name; }
Interpolation.prototype.render = function (data) { return data[this.name] || ""; }

function* parse(str) {
	var openDelimiter = '{{';
	var closeDelimiter = '}}';

	var i = 0;
	while (i < str.length) {
		var openPos = str.indexOf(openDelimiter, i);

		if (openPos === -1) {
			yield new Literal(str.slice(i));
			break;
		}

		if (openPos > i) {
			yield new Literal(str.slice(i, openPos));
		}

		i = openPos + openDelimiter.length;

		// TODO Figure out expected closing delimiter
		// The first char should determine some special cases:
		//  '{' should probably lead to expecting '}' + closeDelimiter
		//  '=' should probably lead to expecting '=' + closeDelimiter

		var closePos = str.indexOf(closeDelimiter, i);
		if (closePos === -1) throw new Error("Mustache tag opened without being closed");

		var tagContents = str.slice(i, closePos);
		yield new Interpolation(tagContents);
		// TODO Handle tags better! :P

		i = closePos + closeDelimiter.length;
	}
}

function render(template, data) {
	var p = parse(template);

	var bufs = [];
	for (var x = p.next(); !x.done; x = p.next()) {
		bufs.push(x.value.render(data));
	}

	return bufs.join('');
}

module.exports = {
	parse,
	render
};
