'use strict';

const s = require('./scanner');
const a = require('./ast');

function parser(str) {
	const tokens = s.scanner(str);
	const sequenceStack = [];
	const tagStack = [];
	sequenceStack.push([]);

	for (var i = tokens.next(); !i.done; i = tokens.next()) {
		const token = i.value;
		const top = sequenceStack[sequenceStack.length - 1];

		switch (token.type) {
		case s.LINE_START: top.push(new a.LineStart()); break;
		case s.LITERAL: top.push(new a.Literal(token.text)); break;
		case s.INTERPOLATION: top.push(new a.Interpolation(token.path, token.verbatim)); break;
		case s.PARTIAL: top.push(new a.Partial(token.name, token.margin || "")); break;

		case s.SECTION_OPEN: {
			const nestedSequence = [];
			top.push(new a.Section(token.path, new a.Sequence(nestedSequence)));
			tagStack.push(token.path);
			sequenceStack.push(nestedSequence);
			break;
		}

		case s.SECTION_NEG_OPEN: {
			const nestedSequence = [];
			top.push(new a.NegativeSection(token.path, new a.Sequence(nestedSequence)));
			tagStack.push(token.path);
			sequenceStack.push(nestedSequence);
			break;
		}

		case s.SECTION_CLOSE: {
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

	return new a.Sequence(sequenceStack[0]);
}

module.exports = parser;
