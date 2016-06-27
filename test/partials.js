'use strict';

const mustachio = require('../');
const path = require('path');
const chai = require('chai');
const assert = chai.assert;

function testRender(template, data, expected) {
	return done => {
		const partials = new mustachio.partials.FsPartials(path.join(__dirname, 'partials'));
		mustachio.string(template).render(data, partials).string().then(actual => {
			assert.equal(expected, actual);
			done();
		}).catch(done);
	};
}

describe('FsPartials', function() {
	it('should resolve partials file', testRender("{{>apekatt}}", {}, "apekatt\n"));
});
