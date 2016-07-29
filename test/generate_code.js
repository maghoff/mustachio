'use strict';

const mustachio = require('../');
const chai = require('chai');
const util = require('./util');

const isStream = require('is-stream');
const escape = require('../lib/html').escape;
const resolve = require('../lib/resolve');
const Context = require('../lib/context');

function stringify(value) { if (typeof value === 'number') return '' + value; if (!value) return ''; return '' + value; }

function compileTemplate(templateAST) {
	const code = ["(function(isStream, escape, resolve, stringify){return function*(context){"];
	code.push(templateAST.generateCode());
	code.push("}})");
//	console.log(code.join('\n'));
	return eval(code.join(''))(isStream, escape, resolve, stringify);
}

function testRender(template, data, expected) {
	return () => {
		const f = mustachio.string(template).template;//compileTemplate(mustachio.string(template).template);

		const rendering = f(new Context(data || {}));

		const actual = [];
		for (let text of rendering) {
			actual.push(text);
		}

		chai.assert.equal(expected, actual.join(''));
	};
}

describe('render', function() {
	it('should not interpolate a simple string', testRender("apekatt", {}, "apekatt"));
	it('should manage lots of empty interpolations', testRender("ap{{}}ek{{}}at{{}}t", {}, "apekatt"));
	it('should interpolate', testRender("ape{{feline}}", { feline: "katt" }, "apekatt"));

	it('should complain about unclosed tag', function () {
		chai.expect(() => mustachio.string("ape{{katt")).to.throw();
	});

	it('should interpolate 0 as number', testRender("ape{{zero}}katt", { zero: 0 }, "ape0katt"));

	it('should treat string as boolean true in section', testRender("{{#string}}yes{{/string}}", { string: "true" }, "yes"));
	it('should treat string as boolean true in negative section', testRender("{{^string}}no{{/string}}", { string: "true" }, ""));
});
