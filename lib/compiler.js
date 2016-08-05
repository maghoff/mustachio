'use strict';

const isStream = require('is-stream');
const escape = require('./html').escape;
const resolve = require('./resolve');
const runtime = require('./runtime');
const parser = require('./parser');

function jsFromAst(ast) {
	const code = ["(function(isStream, escape, resolve, stringify, consumeStream, renderSection){"];

	let nextFunctionId = 0;
	function defun(nested) {
		const functionName = `f${nextFunctionId++}`;
		code.push(`function* ${functionName} (context) { ${nested} }\n`);
		return functionName;
	}

	let nextConstId = 0;
	function define(value) {
		const constName = `c${nextConstId++}`;
		code.push(`const ${constName} = ${JSON.stringify(value)};\n`);
		return constName;
	}

	const root = defun(ast.generateCode(defun, define));
	code.push(`return ${root};`);

	code.push("})");
	return code.join('');
}

function instantiateCode(code) {
	return eval(code)(isStream, escape, resolve, runtime.stringify, runtime.consumeStream, runtime.renderSection);
}

function coerceToAst(source) {
	if (typeof source === 'string') return parser(source);
	else return source;
}

function generateCode(source) {
	const ast = coerceToAst(source);
	return jsFromAst(ast);
}

function compile(source) {
	return instantiateCode(generateCode(source));
}

module.exports = {
	generateCode,
	compile,
};
