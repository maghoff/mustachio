#!/usr/bin/env node

'use strict';

const fs = require('fs');
const http = require('http');
const url = require('url');
const mustachio = require('../../');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const reactComponent = require('./react-component');

const mu = mustachio.resolver();

function index(req, res) {
	const data = {
		title: "Mustachio React demo",

		// To be able to see the flush easily from the client side, for
		// example with curl, we add this artificial pause:
		pause: new Promise((resolve, reject) => setTimeout(resolve, 1000)),

		react_contents: function () {
			// React elements are often big and can take a substantial amount
			// of time to render. By including the React root element as a
			// function, we make sure that we can render the header of the
			// page before blocking on the React bits.

			const element = reactComponent(React);
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
}

function javascript(filename, req, res) {
	res.writeHead(200, { "Content-Type": "text/javascript" });
	fs.createReadStream(filename).pipe(res);
}

const server = http.createServer((req, res) => {
	if (req.url === '/') {
		index(req, res);
	} else if (req.url === '/react.js') {
		javascript("node_modules/react/dist/react.js", req, res);
	} else if (req.url === '/react-dom.js') {
		javascript("node_modules/react-dom/dist/react-dom.js", req, res);
	} else if (req.url === '/react-component.js') {
		javascript("react-component.js", req, res);
	} else {
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Not found\n");
	}
});

server.listen(8080, "localhost", function () {
	const a = this.address();
	console.log("Listening on " + url.format({ protocol: "http", hostname: a.address, port: a.port }));
});
