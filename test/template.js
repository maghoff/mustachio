'use strict';

const mustachio = require('../');
const chai = require('chai');

describe('Template', function() {
	it('should not allow consuming the same stream twice', () => {
		const template = mustachio.string("apekatt");
		const rendering = template.render({});

		rendering.string();

		chai.expect(() => rendering.string()).to.throw();
	});
});
