const fs = require('fs');
const path = require('path');
const chai = require('chai');
const mustachio = require('../');

const assert = chai.assert;

function runSpec(name, spec) {
	describe(name, () => {
		spec.tests.forEach(test => {
			it(test.name, () => {
				assert.equal(
					test.expected,
					mustachio.render(
						test.template,
						test.data,
						test.partials
					),
					test.desc
				);
			});
		});
	});
}


describe("mustache-spec", () => {
	fs.readdirSync(path.join(__dirname, 'specs'))
		.filter(x => x.match(/^[^~].*\.json$/))
		.forEach(x => runSpec(x, require(`./specs/${x}`)));
});
