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

	it('should ignore missing partials file', testRender("({{>monkeybusiness}})", {}, "()"));
});

describe('Fs', function() {
	const testRender = testRenderCore.bind(null, mustachio.partials.Fs);

	it('should resolve partials file', testRender("{{>apekatt}}", {}, "apekatt\n"));
});

describe('FsWatch', function() {
	const testRender = testRenderCore.bind(null, mustachio.partials.FsWatch);

	it('should resolve partials file', testRender("{{>apekatt}}", {}, "apekatt\n"));
});

describe('InMemory', function() {
	function testRender(template, data, partials, expected) {
		return done => {
			const resolver = new mustachio.partials.InMemory(partials);
			mustachio.string(template).render(data, resolver).string().then(actual => {
				assert.equal(expected, actual);
				done();
			}).catch(done);
		};
	}

	it('should resolve partials', testRender("{{>apekatt}}", {}, { apekatt: "apekatt\n" }, "apekatt\n"));

	it('should render margin on every line', testRender("  {{>a}}", {}, { a: "a\nb\nc\n" }, "  a\n  b\n  c\n"));
	it('should render margin within nested sections', testRender(
		"  {{>a}}",
		{ x: [ 1, 2, 3 ] },
		{ a: "{{#x}}\n- {{.}}\n{{/x}}" },
		"  - 1\n  - 2\n  - 3\n"
	));
});
