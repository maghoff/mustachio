'use strict';

module.exports = function* (gen, size) {
	let buf = [];
	for (let x of gen) {
		buf.push(x);
		if (buf.length > size) yield buf.shift();
	}

	while (buf.length) {
		yield buf.shift();
	}
};
