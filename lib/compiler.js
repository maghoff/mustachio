'use strict';

const isStream = require('is-stream');
const escape = require('./html').escape;
const runtime = require('./runtime');
const parser = require('./parser');

function memoize(f) {
	const cache = {};
	return x => {
		if (cache.hasOwnProperty(x)) return cache[x];
		else return cache[x] = f(x);
	};
}

function jsFromAst(ast) {
	const code = ["(function(isStream, escape, stringify, consumeStream, renderSection){"];

	let nextFunctionId = 0;
	const defun = memoize(nested => {
		const functionName = `f${nextFunctionId++}`;
		code.push(`function* ${functionName} (context) { ${nested} }\n`);
		return functionName;
	});

	let nextConstId = 0;
	const define = memoize(value => {
		const constName = `c${nextConstId++}`;
		code.push(`const ${constName} = ${JSON.stringify(value)};\n`);
		return constName;
	});

	const root = defun(ast.generateCode(defun, define));
	code.push(`return ${root};`);

	code.push("})");
	return code.join('');
}

function instantiateCode(code) {
	return eval(code)(isStream, escape, runtime.stringify, runtime.consumeStream, runtime.renderSection);
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
