'use strict';

const GeneratorStream = require('./lib/generator-stream');
const compile = require('./lib/compiler').compile;
const partials = require('./lib/partials');
const Context = require('./lib/context');
const compiler = require('./lib/compiler');


function Rendering(stream) {
	this._stream = stream;
}

Rendering.prototype.string = function () {
	return new Promise((resolve, reject) => {
		const buf = [];
		this._stream.on('data', chunk => buf.push(chunk));
		this._stream.on('error', reject);
		this._stream.on('end', () => resolve(buf.join('')));
	});
};

Rendering.prototype.stream = function () {
	return this._stream;
};


function Template(template) {
	this.template = template;
}

Template.prototype.render = function (data, partials) {
	const r = this.template(Context.createRoot(data, partials));
	const reader = new GeneratorStream(r);

	data.flush = () => reader.flush();

	return new Rendering(reader);
};


function resolver(opts) {
	opts = opts || {};

	const partialsResolver = opts.partialsResolver || new partials.FsWatch(opts.root, opts.suffixes);

	return (templateName, data) => {
		const context = Context.createRoot(data || {}, partialsResolver);

		const template = partialsResolver.get(templateName);

		const iterator =
			(template instanceof Promise)
				? (function* () {
					const t2 = yield Promise.resolve(template);
					yield* t2(context);
				})()
				: template(context);

		const stream = new GeneratorStream(iterator);

		data.flush = () => stream.flush();

		return new Rendering(stream);
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
