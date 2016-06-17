'use strict';

const Readable = require('stream').Readable;

function GeneratorStream(source) {
	if (!source.next) throw new TypeError('source must be an iterator');

	Readable.call(this, {objectMode: true});
	this._source = source;
}
GeneratorStream.prototype = Object.create(Readable.prototype, {constructor: {value: GeneratorStream}});

GeneratorStream.prototype._read = function(size) {
	try {
		var chunk, buf=[], sz=0;

		while (sz < 4096) {
			chunk = this._source.next();
			if (chunk.done) break;

			buf.push(chunk.value);
			sz += chunk.value.length;
		}

		if (sz) this.push(buf.join(''));
		if (chunk.done) this.push(null);
	} catch (e) {
		this.emit('error', e);
	}
};

module.exports = GeneratorStream;
