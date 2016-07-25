'use strict';

const Readable = require('stream').Readable;

function GeneratorStream(source) {
	if (!source.next) throw new TypeError('source must be an iterator');

	Readable.call(this);
	this._source = source;

	this._buf = [];
	this._sz = 0;

	this._outstandingPromise = false;
	this._resolvedPromise = undefined;
}
GeneratorStream.prototype = Object.create(Readable.prototype, {constructor: {value: GeneratorStream}});

GeneratorStream.prototype._flush = function() {
	if (!this._sz) return;
	const buf = this._buf.join('');
	this._buf.length = this._sz = 0;
	return this.push(buf);
};

GeneratorStream.prototype._read = function (size) {
	if (this._outstandingPromise) return;

	try {
		let chunk;

		while (this._sz < size) {
			chunk = this._source.next(this._resolvedPromise);
			this._resolvedPromise = undefined;

			if (chunk.done) break;
			if (chunk.value instanceof Promise) break;

			this._buf.push(chunk.value);
			this._sz += chunk.value.length;
		}

		if (this._sz >= size) this._flush();

		if (chunk.done) {
			this._flush();
			this.push(null);
		}

		if (chunk.value instanceof Promise) {
			this._outstandingPromise = true;
			chunk.value.then(result => {
				this._resolvedPromise = result;
				this._outstandingPromise = false;
				this._read(size);
			}).catch(err => {
				this.emit('error', err);
			});
		}
	} catch (e) {
		this.emit('error', e);
	}
};

module.exports = GeneratorStream;
