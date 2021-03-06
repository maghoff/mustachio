'use strict';

const mustachio = require('../');
const util = require('./util');
const testRender = util.testRender, expectError = util.expectError;

describe('function', function() {
	it('should resolve a simple function data item', testRender(
		"{{data}}",
		{ data: () => "katt" },
		"katt"));

	it('should resolve a function returning an object', testRender(
		"{{#data}}{{one}}{{two}}{{/data}}",
		{ data: () => ({ one: "ape", two: "katt" }) },
		"apekatt"));

	it('should resolve a function returning an array', testRender(
		"{{#data}}{{.}}{{/data}}",
		{ data: () => ["ape", "katt"] },
		"apekatt"));

	it('should resolve functions returning functions', testRender(
		"{{data}}",
		{ data: () => () => () => "apekatt" },
		"apekatt"));

	it('should resolve a function inside an array', testRender(
		"{{#array}}{{.}}{{/array}}",
		{ array: () => ["ape", () => "katt"] },
		"apekatt"));

	it('should resolve when root is function', testRender(
		"ape{{feline}}",
		() => ({ feline: "katt" }),
		"apekatt"));

	it('should have `this` set correctly', testRender(
		"{{data}}",
		{ data: "apekatt", f: function () { return this.data; } },
		"apekatt"));

	it('should have `this` set correctly when nested', testRender(
		"{{#a}}{{#b}}{{#c}}{{d}}{{/c}}{{/b}}{{/a}}",
		{ a: { b: { c: { d: function () { return this.x; }, x: "apekatt" } } } },
		"apekatt"));

	it('should propagate error', expectError(
		"{{data}}",
		{ data: () => { throw new Error("Error"); } }));

	describe('with (old) prototypal inheritance', () => {
		function Base() {}
		Base.prototype.f = () => "apekatt";
		function Derived() { Base.call(this); }
		require('util').inherits(Derived, Base);

		it('should find inherited methods', testRender(
			"{{data.f}}-{{#data}}{{f}}{{/data}}",
			{ data: new Derived() },
			"apekatt-apekatt"));
	});

	describe('with (new) classical inheritance', () => {
		class Base {
			f() { return "apekatt"; }
		}
		class Derived extends Base {
		}

		it('should find inherited methods', testRender(
			"{{data.f}}-{{#data}}{{f}}{{/data}}",
			{ data: new Derived() },
			"apekatt-apekatt"));
	});
});
