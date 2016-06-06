const fs = require('fs');
const path = require('path');
const chai = require('chai');
const mustachio = require('../');

const assert = chai.assert;

function runSelectSpecs() {
	runSpec("interpolation.json", require('./specs/interpolation.json'));
}

function runAllSpecs() {
	// TODO This will be the day..!
	fs.readdirSync(path.join(__dirname, 'specs'))
		.filter(x => x.match(/\.json$/))
		.forEach(x => runSpec(x, require(`./specs/${x}`)));
}

function runSpec(name, spec) {
	describe(name, () => {
		spec.tests.forEach(test => {
			it(test.name, () => {
				// TODO Support partials in specs
				assert.equal(
					test.expected,
					mustachio.render(
						test.template,
						test.data
					),
					test.desc
				);
			});
		});
	});
}


describe("mustache-spec", () => {
	runSelectSpecs();
});
