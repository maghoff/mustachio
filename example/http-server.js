#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const mustachio = require('../');

const template = mustachio.string(fs.readFileSync(`${__dirname}/template.mu.html`, 'utf8'));
const numbers = [];
for (var i=0; i < 100000; ++i) numbers.push(i);

const server = http.createServer((req, res) => {
	const start = new Date();
	res.on('finish', () => {
		const end = new Date();
		console.log(`Finished sending response in ${end - start}ms`);
	});

	const data = {
		path: req.url,
		headers:
			Object.keys(req.headers)
				.map(key => ({ key: key, value: req.headers[key] })),
		numbers: numbers
	};
	template.render(data).stream().pipe(res);
});
server.listen(8000);
