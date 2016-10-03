'use strict';

const compile = require('./lib/compiler').compile;
const partials = require('./lib/partials');
const Template = require('./lib/template');


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


module.exports = {
	partials,
	compile,
	string,
	resolver,
};
