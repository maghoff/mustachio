#!/usr/bin/env node

'use strict';

const http = require('http');
const url = require('url');
const mustachio = require('../../');
const pg = require('pg');
const QueryStream = require('pg-query-stream');

const mu = mustachio.resolver();

const server = http.createServer((req, res) => {
	// Prepare data for template
	const data = {
		numbers:
			new Promise((resolve, reject) => {
				pg.connect((err, client, done) => {
					if (err) return reject(err);
					else return resolve({client, done});
				});
			})
			.then(x => {
				const query = new QueryStream('SELECT * FROM generate_series(0, $1) num', [100000]);
				const stream = x.client.query(query);

				// Release the client when the stream is finished
				stream.on('end', x.done);

				return stream;
			})
	};

	// Stream render response
	res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });

	const stream = mu("postgres-query-stream", data).stream();
	stream.pipe(res);
	stream.on('error', err => {
		console.error(err.stack);
		res.destroy();
	});
});

server.listen(8080, "localhost", function () {
	const a = this.address();
	console.log("Listening on " + url.format({ protocol: "http", hostname: a.address, port: a.port }));
});
