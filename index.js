'use strict';

const GeneratorStream = require('./lib/generator-stream');
const parser = require('./lib/parser');
const partials = require('./lib/partials');
const Context = require('./lib/context');


const isStream = require('is-stream');
const escape = require('./lib/html').escape;
const resolve = require('./lib/resolve');
const runtime = require('./lib/runtime');

function compileTemplate(templateAST) {
	const code = ["(function(isStream, escape, resolve, stringify, consumeStream, renderSection){"];

	let nextFunctionId = 0;
	function defun(nested) {
		const functionName = `f${nextFunctionId++}`;
		code.push(`function* ${functionName} (context) { ${nested} }\n`);
		return functionName;
	}

	const root = defun(templateAST.generateCode(defun));
	code.push(`return ${root};`);

	code.push("})");
	return eval(code.join(''))(isStream, escape, resolve, runtime.stringify, runtime.consumeStream, runtime.renderSection);
}


function render(template, data, partials) {
	return string(template).render(data, partials).string();
}

function Template(templateAST) {
	this.template = compileTemplate(templateAST);
}
Template.prototype.render = function (data, partials) {
	const r = this.template(new Context(data, partials, ""));
	const reader = new GeneratorStream(r);

	return {
		string: () => {
			return new Promise((resolve, reject) => {
				const buf = [];
				reader.on('data', chunk => buf.push(chunk));
				reader.on('error', reject);
				reader.on('end', () => resolve(buf.join('')));
			});
		},
		stream: () => reader
	};
};

function resolver(opts) {
	opts = opts || {};

	const partialsResolver = opts.partialsResolver || new partials.FsWatch(opts.root, opts.suffixes);

	return (templateName, data) => {
		const context = new Context(data || {}, partialsResolver, "");

		const template = partialsResolver.get(templateName);

		const iterator =
			(template instanceof Promise)
				? (function* () {
					const t2 = yield Promise.resolve(template);
					yield* t2(context);
				})()
				: template(context);

		const stream = new GeneratorStream(iterator);

		return {
			string: () => new Promise((resolve, reject) => {
				const buf = [];
				reader.on('data', chunk => buf.push(chunk));
				reader.on('error', reject);
				reader.on('end', () => resolve(buf.join('')));
			}),
			stream: () => stream
		};
	};
}

function string(templateString) {
	return new Template(parser(templateString));
}

module.exports = {
	render,
	string,
	partials,
	Template,
	resolver,
	compileTemplate,
};
