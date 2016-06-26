'use strict';

const mustachio = require('../');
const chai = require('chai');

const assert = chai.assert;

function testRender(template, data, expected) {
	return () => {
		const actual = mustachio.render(template, data);
		assert.equal(expected, actual);
	};
}

describe('integration', function() {
	it('should resolve functions yielded from generators', testRender(
		"{{#data}}{{.}}{{/data}}",
		{ data: function* () {
			yield () => "ape";
			yield "katt";
		} },
		"apekatt"));
});
