'use strict';

const LINE_START = 1;
const LITERAL = 2;
const INTERPOLATION = 3;
const PARTIAL = 4;
const COMMENT = 5;
const SECTION_OPEN = 6;
const SECTION_NEG_OPEN = 7;
const SECTION_CLOSE = 8;

function* core_scanner(str) {
	const ctx = {
		openDelimiter: '{{',
		closeDelimiter: '}}'
	};

	var i = 0;

	function line_start() { return { type: LINE_START } }
	function literal(text) { return { type: LITERAL, text: text } }
	function interpolation(path, verbatim) { return { type: INTERPOLATION, path: path, verbatim: !!verbatim } }
	function partial(name) { return { type: PARTIAL, name: name } }
	function comment() { return { type: COMMENT } }

	function section_open(path) { return { type: SECTION_OPEN, path: path } }
	function section_neg_open(path) { return { type: SECTION_NEG_OPEN, path: path } }
	function section_close(path) { return { type: SECTION_CLOSE, path: path } }

	function* split_lines(buf) {
		var i = 0;
		while (i < buf.length) {
			const newLinePos = buf.indexOf('\n', i);
			if (newLinePos === -1) break;
			yield literal(buf.slice(i, newLinePos+1));
			yield line_start();
			i = newLinePos + 1;
		}
		if (i < buf.length) yield literal(buf.slice(i));
	}

	yield line_start();
	while (i < str.length) {
		const openPos = str.indexOf(ctx.openDelimiter, i);

		if (openPos === -1) {
			yield* split_lines(str.slice(i));
			i = str.length;
			break;
		}

		if (openPos > i) yield* split_lines(str.slice(i, openPos));

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

function* standalone_tags(tokens) {
	var blankSoFar = true, standaloneTokenOnLine = null;
	var buf = [];

	function is_standalone(type) {
		return type === SECTION_OPEN ||
			type === SECTION_NEG_OPEN ||
			type === SECTION_CLOSE ||
			type === PARTIAL ||
			type === COMMENT;
	}

	function* giveUpLine() {
		while (buf.length) yield buf.shift();
		blankSoFar = false;
	}

	function* endOfLine() {
		if (blankSoFar) {
			if (standaloneTokenOnLine) {
				if (standaloneTokenOnLine.type === PARTIAL) {
					const i = buf.findIndex((x, i) => i >= 1 && x.type !== LITERAL);
					const margin = buf.slice(1, i).map(x => x.text).join('');
					standaloneTokenOnLine.margin = margin;
				}
				buf.length = 0;
				yield standaloneTokenOnLine;
			} else {
				yield* giveUpLine();
			}
		}
		blankSoFar = true;
		standaloneTokenOnLine = null;
	}

	for (var i = tokens.next(); !i.done; i = tokens.next()) {
		const token = i.value;

		if (token.type === LINE_START) {
			yield* endOfLine();
			buf.push(token);
		} else if (token.type === LITERAL) {
			if (blankSoFar) {
				buf.push(token);

				const spaceOnly = token.text.search(/[^\s]/) === -1;
				blankSoFar = blankSoFar && spaceOnly;

				if (!blankSoFar) yield* giveUpLine();
			} else {
				yield token;
			}
		} else if (is_standalone(token.type)) {
			if (blankSoFar) {
				if (!standaloneTokenOnLine) {
					standaloneTokenOnLine = token;
					buf.push(token);
				} else {
					yield* giveUpLine();
					yield token;
				}
			} else {
				yield token;
			}
		} else {
			if (blankSoFar) yield* giveUpLine();
			yield token;
		}
	}

	// Avoid yielding LINE_START as the last token of a file
	if (buf.length === 1) buf.shift();

	yield* endOfLine();
}

function* scanner(str) {
	yield* standalone_tags(core_scanner(str));
}

module.exports = {
	LINE_START,
	LITERAL,
	INTERPOLATION,
	PARTIAL,
	COMMENT,
	SECTION_OPEN,
	SECTION_NEG_OPEN,
	SECTION_CLOSE,
	core_scanner,
	standalone_tags,
	scanner
};
