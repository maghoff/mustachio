'use strict';

const memoryStreams = require('memory-streams');
const GeneratorStream = require('./lib/generator-stream');
const parser = require('./lib/parser');
const Context = require('./lib/context');


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
	return new Template(parser(templateString));
}

module.exports = {
	render,
	string
};
