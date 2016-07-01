'use strict';

const GeneratorStream = require('./lib/generator-stream');
const parser = require('./lib/parser');
const partials = require('./lib/partials');
const Context = require('./lib/context');


function render(template, data, partials) {
	return string(template).render(data, partials).string();
}

function Template(templateAST) {
	this.template = templateAST;
}
Template.prototype.render = function (data, partials) {
	const r = this.template.render(new Context(data, partials));
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
		const context = new Context(data || {}, partialsResolver);

		const template = partialsResolver.get(templateName);

		const iterator =
			(template instanceof Promise)
				? (function* () {
					const ast = yield Promise.resolve(template);
					yield* ast.render(context);
				})()
				: template.render(context);

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
};
