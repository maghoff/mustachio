'use strict';

var Readable = require('stream').Readable;

function GeneratorStream(source) {
	if (!source.next) throw new TypeError('source must be an iterator');

	Readable.call(this, {objectMode: true});
	this._source = source;
}
GeneratorStream.prototype = Object.create(Readable.prototype, {constructor: {value: GeneratorStream}});

GeneratorStream.prototype._read = function(size) {
	try {
		// TODO This implementation does not buffer aggressively enough, and
		// the target stream typically does not either
		do {
			var r = this._source.next();

			if (r.done) {
				this.push(null);
				break;
			}
		} while (this.push(r.value));
	} catch (e) {
		this.emit('error', e);
	}
};

module.exports = GeneratorStream;
