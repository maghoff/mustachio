'use strict';

const memoryStreams = require('memory-streams');

function resolve(context, path) {
	function r(data, path) {
		if (data == null) return;
		if (path.length === 0) return data;
		return r(data[path[0]], path.slice(1));
	}

	if (path.length === 0) return context.data;
	return r(context.get(path[0]), path.slice(1));
}

function stringify(value) {
	if (typeof value === 'number') return "" + value;
	if (!value) return "";
	return "" + value;
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

	if (!value) return;

	if (Array.isArray(value)) {
		for (var i = 0; i < value.length; ++i) {
			yield* this.nested.render(context.subcontext(value[i]));
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
	const value = resolve(context, this.path);

	if (Array.isArray(value) && value.length) return;
	if (!Array.isArray(value) && value) return;

	yield* this.nested.render(context);
};

function Partial(partialName) {
	this.partialName = partialName;
}
Partial.prototype.render = function* (context) {
	var partial = context.getPartial(this.partialName);
	if (!partial) return;

	yield* parse(partial).render(context);
};

function Context(data, parent, partials) {
	this.data = data;
	this.parent = parent;
	this.partials = partials;
}
Context.prototype.get = function (id) {
	if (this.data.hasOwnProperty(id)) return this.data[id];
	else if (this.parent) return this.parent.get(id);
};
Context.prototype.getPartial = function (id) {
	if (this.partials && this.partials.hasOwnProperty(id)) return this.partials[id];
	else if (this.parent) return this.parent.getPartial(id);
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

function* scanner(str) {
	const ctx = {
		openDelimiter: '{{',
		closeDelimiter: '}}'
	};

	var i = 0;

	function literal(text) { return { type: 'literal', text: text } }
	function interpolation(path, verbatim) { return { type: 'interpolation', path: path, verbatim: !!verbatim } }
	function partial(name) { return { type: 'partial', name: name } }
	function comment() { return { type: 'comment' } }

	function section_open(path) { return { type: 'section_open', path: path } }
	function section_neg_open(path) { return { type: 'section_neg_open', path: path } }
	function section_close(path) { return { type: 'section_close', path: path } }

	while (i < str.length) {
		const openPos = str.indexOf(ctx.openDelimiter, i);

		if (openPos === -1) {
			yield literal(str.slice(i));
			i = str.length;
			break;
		}

		if (openPos > i) yield literal(str.slice(i, openPos));

		i = openPos + ctx.openDelimiter.length;

		if (i >= str.length) throw new Error("Mustache tag opened without being closed");

		var expectedCloseDelimiter = ctx.closeDelimiter;

		var fn = str[i];

		switch (str[i]) {
		case '{': expectedCloseDelimiter = '}' + ctx.closeDelimiter; break;
		case '=': expectedCloseDelimiter = '=' + ctx.closeDelimiter; break;
		}

		if (fn.match(/[{&=>#/^!]/)) i++;
		else fn = '';

		const closePos = str.indexOf(expectedCloseDelimiter, i);
		if (closePos === -1) throw new Error("Mustache tag opened without being closed");

		const tagContents = str.slice(i, closePos).trim();

		i = closePos + expectedCloseDelimiter.length;

		switch (fn) {
		case '': yield interpolation(tagContents === '.' ? [] : tagContents.split('.'), false); break;
		case '{':
		case '&':
			yield interpolation(tagContents === '.' ? [] : tagContents.split('.'), true); break;
		case '=':
			const delimiters = tagContents.split(/[\t ]+/);
			if (delimiters.length !== 2) throw new Error(`Invalid delimiter specification: ${JSON.stringify(tagContents)}`);
			ctx.openDelimiter = delimiters[0];
			ctx.closeDelimiter = delimiters[1];
			yield comment(); // This makes standalone lines work for delimiter tags
			break;
		case '#':
			yield section_open(tagContents === '.' ? [] : tagContents.split('.'));
			break;
		case '^':
			yield new section_neg_open(tagContents === '.' ? [] : tagContents.split('.'));
			break;
		case '/':
			yield new section_close(tagContents === '.' ? [] : tagContents.split('.'));
			break;
		case '>': yield partial(tagContents); break;
		case '!': yield comment(); break;
		}
	}
}

function is_standalone(type) {
	return type === 'section_open' ||
		type === 'section_neg_open' ||
		type === 'section_close' ||
		type === 'partial' ||
		type === 'comment';
}

function* standalone_tags(tokens) {
	var preText = "";
	var standaloneTag = null;
	var blankLine = true;
	var hasStandalone = false;

	for (var i = tokens.next(); !i.done; i = tokens.next()) {
		const token = i.value;

		if (token.type === 'literal') {
			if (standaloneTag) {
				if (blankLine && token.text.match(/^[\t ]*\r?\n/)) {
					yield { type: 'literal', text: preText.replace(/[\t ]*$/, '') };
					yield standaloneTag;

					token.text = token.text.replace(/^[\t ]*\r?\n/, '');
				} else {
					if (preText.length) yield { type: 'literal', text: preText };
					yield standaloneTag;
				}
				preText = "";
				standaloneTag = null;
				hasStandalone = false;
				if (token.text === '') continue;
			}

			if (token.text.match(/\n[\t ]*$/)) {
				preText += token.text;
				blankLine = true;
				hasStandalone = false;
			} else if (token.text.match(/^[\t ]*$/)) {
				if (blankLine) preText += token.text;
				else yield token;
			} else {
				yield { type: 'literal', text: preText + token.text };
				preText = "";
				blankLine = false;
			}
		} else if (is_standalone(token.type)) {
			if (standaloneTag) {
				if (preText.length) yield { type: 'literal', text: preText };
				preText = "";

				yield standaloneTag;
				yield token;
				standaloneTag = null;
				blankLine = false;
			} else {
				if (hasStandalone) yield token;
				else standaloneTag = token;
			}
			hasStandalone = true;
		} else {
			if (preText.length) yield { type: 'literal', text: preText };
			preText = "";
			if (standaloneTag) yield standaloneTag;
			standaloneTag = null;
			if (token.type !== 'comment') yield token;
			blankLine = false;
		}
	}

	if (blankLine && standaloneTag) {
		yield { type: 'literal', text: preText.replace(/[\t ]*$/, '') };
		yield standaloneTag;
		preText = "";
		standaloneTag = null;
	}

	if (preText.length) yield { type: 'literal', text: preText };
	preText = "";

	if (standaloneTag) yield standaloneTag;
	standaloneTag = null;
}

function parse(str) {
	const tokens = standalone_tags(scanner(str));
	const sequenceStack = [];
	const tagStack = [];
	sequenceStack.push([]);

	for (var i = tokens.next(); !i.done; i = tokens.next()) {
		const token = i.value;
		const top = sequenceStack[sequenceStack.length - 1];

		switch (token.type) {
		case 'literal': top.push(new Literal(token.text)); break;
		case 'interpolation': top.push(new Interpolation(token.path, token.verbatim)); break;
		case 'partial': top.push(new Partial(token.name)); break;

		case 'section_open': {
			const nestedSequence = [];
			top.push(new Section(token.path, new Sequence(nestedSequence)));
			tagStack.push(token.path);
			sequenceStack.push(nestedSequence);
			break;
		}

		case 'section_neg_open': {
			const nestedSequence = [];
			top.push(new NegativeSection(token.path, new Sequence(nestedSequence)));
			tagStack.push(token.path);
			sequenceStack.push(nestedSequence);
			break;
		}

		case 'section_close': {
			if (sequenceStack.length < 1) throw new Error("Too many closing tags");
			sequenceStack.pop();

			const openingTag = tagStack.pop();
			if (token.path.join('.') != openingTag.join('.')) {
				throw new Error(`Closing tag ${JSON.stringify(token.path)} not ` +
					`matching opening tag ${JSON.stringify(openingTag)}`);
			}
			break;
		}
		}
	}

	if (sequenceStack.length !== 1) {
		throw new Error("Some opened sections were not closed");
	}

	return new Sequence(sequenceStack[0]);
}

var Readable = require('stream').Readable;

function GeneratorStream(source) {
    if (!source.next) throw new TypeError('source must be an iterator');

    Readable.call(this, {objectMode: true});
    this._source = source;
}
GeneratorStream.prototype = Object.create(Readable.prototype, {constructor: {value: GeneratorStream}});

GeneratorStream.prototype._read = function(size) {
	try {
		// TODO This implementation does not buffer aggressively enough, and
		// the target stream typically does not either
		do {
			var r = this._source.next();

			if (r.done) {
				this.push(null);
				break;
			}
		} while (this.push(r.value));
	} catch (e) {
		this.emit('error', e);
	}
};

function render(template, data, partials) {
	return string(template).render(data, partials).string();
}

function Template(templateAST) {
	this.template = templateAST;
}
Template.prototype.render = function (data, partials) {
	const r = this.template.render(new Context(data, null, partials));
	const reader = new GeneratorStream(r);

	return {
		string: () => new Promise((resolve, reject) => {
			const writer = new memoryStreams.WritableStream();

			reader.pipe(writer);
			reader.on('end', function () {
				resolve(writer.toString());
			});

			reader.on('error', reject);
			writer.on('error', reject);
		}),
		stream: () => reader
	};
};

function string(templateString) {
	return new Template(parse(templateString));
}

module.exports = {
	render,
	string
};
