'use strict';

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
			const chunks = [];

			reader.on('end', function () {
				resolve(chunks.join(''));
			});
			reader.on('data', function (chunk) {
				chunks.push(chunk);
			});

			reader.on('error', reject);
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
