'use strict';

const GeneratorStream = require('./lib/generator-stream');
const compile = require('./lib/compiler').compile;
const partials = require('./lib/partials');
const Context = require('./lib/context');
const compiler = require('./lib/compiler');


function Template(template) {
	this.template = template;
}

Template.prototype.render = function (data, partials) {
	const context = Context.createRoot(data, partials);

	const iterator =
		(this.template instanceof Promise)
			? (function* () {
				const t2 = yield Promise.resolve(this.template);
				yield* t2(context);
			}.bind(this))()
			: this.template(context);

	const stream = new GeneratorStream(iterator);

	data.flush = () => stream.flush();

	return {
		string: () => {
			return new Promise((resolve, reject) => {
				const buf = [];
				stream.on('data', chunk => buf.push(chunk));
				stream.on('error', reject);
				stream.on('end', () => resolve(buf.join('')));
			});
		},
		stream: () => stream
	};
};


function resolver(opts) {
	opts = opts || {};

	const partialsResolver = opts.partialsResolver || new partials.FsWatch(opts.root, opts.suffixes);

	return (templateName, data) => {
		const template = partialsResolver.get(templateName);

		return new Template(template).render(data || {}, partialsResolver);
	};
}

function string(templateString) {
	return new Template(compile(templateString));
}

function render(template, data, partials) {
	return string(template).render(data, partials).string();
}

module.exports = {
	render,
	string,
	partials,
	Template,
	resolver,
	compile,
};
