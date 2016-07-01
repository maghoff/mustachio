'use strict';

module.exports = Object.assign(
	{
		InMemory: require('./in-memory'),
	},
	require('./fs')
);
