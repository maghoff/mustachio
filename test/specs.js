const fs = require('fs');
const path = require('path');
const chai = require('chai');
const mustachio = require('../');

const assert = chai.assert;

function runSpec(name, spec) {
	describe(name, () => {
		spec.tests.forEach(test => {
			it(test.name, done => {
				mustachio
					.string(test.template)
					.render(test.data, new mustachio.partials.InMemory(test.partials))
					.string()
					.then(actual => {
						assert.equal(test.expected, actual, test.desc);
						done();
					}).catch(done);
			});
		});
	});
}


describe("mustache-spec", () => {
	fs.readdirSync(path.join(__dirname, 'specs'))
		.filter(x => x.match(/^[^~].*\.json$/))
		.forEach(x => runSpec(x, require(`./specs/${x}`)));
});
