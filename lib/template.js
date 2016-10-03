'use strict';

const GeneratorStream = require('./generator-stream');
const Context = require('./context');


function alreadyConsumedError() {
	const err = new Error('Stream has already been consumed');
	err.code = 'MUSTACHIO_STREAM_CONSUMED';
	return err;
}

function Template(template) {
	this.template = template;
}

Template.prototype.render = function (data, partials) {
	const context = Context.createRoot(data, partials);

	const iterator =
		(this.template instanceof Promise)
			? (function* () {
				const resolvedTemplate = yield Promise.resolve(this.template);
				yield* resolvedTemplate(context);
			}.bind(this))()
			: this.template(context);

	const stream = new GeneratorStream(iterator);

	if (data.mu_flush === undefined) data.mu_flush = () => stream.flush();

	let consumed = false;

	return {
		string: () => {
			if (consumed) throw alreadyConsumedError();
			consumed = true;

			return new Promise((resolve, reject) => {
				const buf = [];
				stream.on('data', chunk => buf.push(chunk));
				stream.on('error', reject);
				stream.on('end', () => resolve(buf.join('')));
			});
		},
		stream: () => {
			if (consumed) throw alreadyConsumedError();
			consumed = true;

			return stream;
		}
	};
};


module.exports = Template;
