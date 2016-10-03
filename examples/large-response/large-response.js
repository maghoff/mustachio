#!/usr/bin/env node

/*

This example generates a large response to demonstrate some features of the
streaming nature of Mustachio:

 - The client starts receiving the response immediately, before it is fully
   rendered
 - If the client or network cannot keep up, flow control stops the rendering
   on the server side, conserving resources and allowing them to be used for
   other things

The last point can be tested by using curl on the command line:

 - `curl http://localhost:8080/ >/dev/null` should cause the quickest
   rendering. It is fast to dump things to /dev/null.
 - `curl http://localhost:8080/` should cause the time reported by the
   server to be slightly longer, since the response has to be written to
   the terminal.
 - `curl http://localhost:8080/ | less` should cause the server to pause
   the rendering before it is finished. Scrolling down causes the server
   to render more, as needed.

*/

'use strict';

const fs = require('fs');
const http = require('http');
const url = require('url');
const mustachio = require('../../');

const mu = mustachio.resolver();

const server = http.createServer((req, res) => {
	// Measure time for complete requests
	const start = new Date();
	res.on('finish', () => {
		const end = new Date();
		console.log(`Finished sending response in ${end - start}ms`);
	});

	// Prepare data for template
	const data = {
		path: req.url,
		headers:
			Object.keys(req.headers)
				.map(key => ({ key, value: req.headers[key] })),
		numbers: function* () {
			for (let i = 0; i < 100000; ++i) yield i;
		}
	};

	// Stream render response
	res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });

	const stream = mu("large-response", data).stream();

	// Reduce in-memory buffering to make flow control more readily apparent:
	stream._readableState.highWaterMark = 128;

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
