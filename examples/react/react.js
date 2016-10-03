#!/usr/bin/env node

'use strict';

const fs = require('fs');
const http = require('http');
const url = require('url');
const mustachio = require('../../');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const mu = mustachio.resolver();

const server = http.createServer((req, res) => {
	const data = {
		title: "Mustachio React demo",
		react_contents: function () {
			// React elements are often big and can take a substantial amount
			// of time to render. By including the React root element as a
			// function, we make sure that we can render the header of the
			// page before blocking on the React bits.

			const element = React.createElement('div', null, 'Hello, World!');
			return ReactDOMServer.renderToString(element);
		}
	};

	// Stream render response
	res.writeHead(200, { "Content-Type": "text/html;charset=utf-8" });

	const stream = mu("react", data).stream();

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
