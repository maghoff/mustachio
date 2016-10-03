const GeneratorStream = require('./generator-stream');
const Context = require('./context');


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


module.exports = Template;
