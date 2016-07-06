'use strict';

const mustachio = require('../');
const chai = require('chai');
const assert = chai.assert;

describe('tonicExample', function() {
	const text = require('../package.json').tonicExample;

	it('should not be empty', () => { assert(text.length !== 0); });

	it('should be executable', () => {
		const realRequire = require;
		require = dep => {
			if (dep === 'mustachio') return mustachio;
			else return realRequire(dep);
		};

		eval(text);
	});
});
