'use strict';

function resolve(context, path) {
	function r(data, path) {
		if (!data) return;
		if (path.length === 0) return data;
		return r(data[path[0]], path.slice(1));
	}

	if (path.length === 0) return context.data;
	return r(context.get(path[0]), path.slice(1));
}

function stringify(value) {
	return "" + (value || "");
}

function Literal(str) { this.str = str; }
Literal.prototype.render = function* (_context) { yield this.str; }

function Interpolation(path, verbatim) {
	this.path = path;
	this.verbatim = verbatim;
}

Interpolation.prototype.render = function* (context) {
	const resolved = stringify(resolve(context, this.path));
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
	const value = resolve(context, this.path);

	if (Array.isArray(value)) {
		for (var i = 0; i < value.length; ++i) {
			yield* this.nested.render(context.subcontext(value[i]));
		}
	} else if (typeof value === 'object') {
		yield* this.nested.render(context.subcontext(value));
	} else {
		if (value) yield* this.nested.render(context.subcontext({ ".": value }));
	}
};

function Context(data, parent) {
	this.data = data;
	this.parent = parent;
}
Context.prototype.get = function (id) {
	if (this.data.hasOwnProperty(id)) return this.data[id];
	else if (this.parent) return this.parent.get(id);
};
Context.prototype.subcontext = function (data) {
	return new Context(data, this);
};

function* escape(str) {
	var i = 0;
	while (i < str.length) {
		var j = str.slice(i).search(/[&<>"']/);
		if (j === -1) {
			yield str.slice(i);
			return;
		}
		j += i;
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

function getSequence(ctx, str) {
	var i = 0;
	var seq = [];

	while (i < str.length) {
		const openPos = str.indexOf(ctx.openDelimiter, i);

		if (openPos === -1) {
			seq.push(new Literal(str.slice(i)));
			i = str.length;
			break;
		}

		if (openPos > i) {
			seq.push(new Literal(str.slice(i, openPos)));
		}

		i = openPos + ctx.openDelimiter.length;

		if (i >= str.length) throw new Error("Mustache tag opened without being closed");

		var expectedCloseDelimiter = ctx.closeDelimiter;

		var fn = str[i];

		switch (str[i]) {
		case '{': expectedCloseDelimiter = '}' + ctx.closeDelimiter; break;
		case '=': expectedCloseDelimiter = '=' + ctx.closeDelimiter; break;
		}

		if (fn.match(/[{&=<#/]/)) i++;
		else fn = '';

		const closePos = str.indexOf(expectedCloseDelimiter, i);
		if (closePos === -1) throw new Error("Mustache tag opened without being closed");

		const tagContents = str.slice(i, closePos).trim();

		i = closePos + expectedCloseDelimiter.length;

		switch (fn) {
		case '': seq.push(new Interpolation(tagContents === '.' ? [] : tagContents.split('.'))); break;
		case '{':
		case '&':
			seq.push(new Interpolation(tagContents === '.' ? [] : tagContents.split('.'), true)); break;
		case '=':
			const delimiters = tagContents.split(/\s+/);
			if (delimiters.length !== 2) throw new Error(`Invalid delimiter specification: ${JSON.stringify(tagContents)}`);
			ctx.openDelimiter = delimiters[0];
			ctx.closeDelimiter = delimiters[1];
			break;
		case '#':
			const nested = getSequence(ctx, str.slice(i));
			i += nested.len;
			seq.push(new Section(tagContents === '.' ? [] : tagContents.split('.'), nested.ast));
			break;
		case '/':
			return {
				ast: new Sequence(seq),
				len: i
			};
		}
	}

	return {
		ast: new Sequence(seq),
		len: i
	};
}

function parse(str) {
	const ctx = {
		openDelimiter: '{{',
		closeDelimiter: '}}'
	};

	const result = getSequence(ctx, str);

	if (result.len !== str.length) throw new Error('Unable to fully parse input');
	return result.ast;
}

function render(template, data) {
	var g = parse(template).render(new Context(data));

	var bufs = [];
	for (var x = g.next(); !x.done; x = g.next()) {
		bufs.push(x.value);
	}

	return bufs.join('');
}

module.exports = {
	render
};
