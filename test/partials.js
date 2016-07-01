'use strict';

const mustachio = require('../');
const path = require('path');
const chai = require('chai');
const assert = chai.assert;

function testRenderCore(resolverClass, template, data, expected) {
	return done => {
		const partials = new resolverClass(path.join(__dirname, 'partials'));
		mustachio.string(template).render(data, partials).string().then(actual => {
			assert.equal(expected, actual);
			done();
		}).catch(done);
	};
}

describe('FsNoCache', function() {
	const testRender = testRenderCore.bind(null, mustachio.partials.FsNoCache);

	it('should resolve partials file', testRender("{{>apekatt}}", {}, "apekatt\n"));
});

describe('Fs', function() {
	const testRender = testRenderCore.bind(null, mustachio.partials.Fs);

	it('should resolve partials file', testRender("{{>apekatt}}", {}, "apekatt\n"));
});

describe('FsWatch', function() {
	const testRender = testRenderCore.bind(null, mustachio.partials.FsWatch);

	it('should resolve partials file', testRender("{{>apekatt}}", {}, "apekatt\n"));
});
