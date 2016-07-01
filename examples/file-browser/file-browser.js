#!/usr/bin/env node

/*

This file uses destructuring syntax. If you are using node 4 or 5, you have to
include the `--harmony_destructuring` command line argument:

    node --harmony_destructuring file-browser.js

*/

'use strict';

const fs = require('fs');
const fsp = require('fs-promise');
const http = require('http');
const map = require('map-iterator');
const mu = require('../../').resolver();
const path = require('path');
const url = require('url');
const peekGenerator = require('./peek-generator');


const ROOT = __dirname;


function fileObject(filepath) {
	return Promise.all([
		fsp.stat(filepath).catch(err => ({err})),
		fsp.lstat(filepath).catch(err => ({err})),
		fsp.readlink(filepath).catch(err => ({err})),
	]).then(([stat, lstat, target]) => ({
		stat, lstat, target,
		name: path.basename(filepath),
		size: () => stat.size.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
	}));
}

function serveDirectory(dirname, req, res) {
	const path_elements = req.url.replace(/\/$/, '').split(path.sep);
	path_elements[0] = 'root';

	const data = {
		dirname: path_elements.map((name, index, a) => ({
			name,
			link: '../'.repeat(a.length - 1 - index) || './',
			current: index === (a.length - 1),
		})),

		// In the template, `files` acts like a list of file items. On this
		// side we see that it is in fact a Promise that resolves to an
		// iterator that successively yields Promises of file objects. All
		// this indirection allows Mustachio to stream render the response
		// incrementally as data becomes available.
		files: fsp.readdir(dirname)
			.then(files => peekGenerator(
				map(files, file => fileObject(path.join(dirname, file))),
				50))
	};

	res.writeHead(200, {'Content-Type': 'text/html;charset=utf8'});

	const renderStream = mu("directory", data).stream();
	renderStream.on('error', err => {
		res.destroy(err);
		console.error(err.stack);
	});
	renderStream.pipe(res);
}

function serveFile(pathname, req, res) {
	res.writeHead(200, { "Content-Type": "text/plain" });
	fs.createReadStream(pathname).pipe(res);
}

function handleRequest(req, res) {
	const pathname = path.join(ROOT, req.url);

	fsp.stat(pathname).then(stat => {
		if (stat.isDirectory()) {
			serveDirectory(pathname, req, res);
		} else {
			serveFile(pathname, req, res);
		}
	})
	.catch(err => {
		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end(err.stack);
	});
}

http.createServer(handleRequest)
	.listen(8080, "localhost", function () {
		const {address, port} = this.address();
		console.log("Listening on " + url.format({ protocol: "http", hostname: address, port }));
	});
