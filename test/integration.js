'use strict';

const mustachio = require('../');
const util = require('./util');
const testRender = util.testRender;

describe('integration', function() {
	it('should resolve functions yielded from generators', testRender(
		"{{#data}}{{.}}{{/data}}",
		{ data: function* () {
			yield () => "ape";
			yield "katt";
		} },
		"apekatt"));

	it('should resolve functions resolved in promises', testRender(
		"{{data}}",
		{ data: Promise.resolve(() => "apekatt") },
		"apekatt"));

	it('should resolve generators resolved in promises', testRender(
		"{{#data}}{{.}}{{/data}}",
		{ data: Promise.resolve(function* () { yield "ape"; yield "katt"; }) },
		"apekatt"));

	it('should recursively resolve elements of arrays', testRender(
		"{{#data}}{{x}}{{/data}}",
		{ data: [ {x:"ape"}, () => { return {x:"katt"}; } ] },
		"apekatt"));

	it('should recursively resolve elements of generators', testRender(
		"{{#data}}{{x}}{{/data}}",
		{ data: function* () {
			yield { x: "ape" };
			yield () => ({ x: "katt" });
		}},
		"apekatt"));

	it('should resolve when root is function nested in promise', testRender(
		"ape{{feline}}",
		Promise.resolve(() => ({ feline: "katt" })),
		"apekatt"));

	it('should resolve when root is promise nested in function', testRender(
		"ape{{feline}}",
		() => Promise.resolve({ feline: "katt" }),
		"apekatt"));
});
