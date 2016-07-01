Mustachio is an experimental pull-based implementation of [the Mustache
templating language][mustache]. It is fully compliant with [version
1.1][v1.1.3] of [the Mustache spec][spec].

[mustache]: https://mustache.github.io/mustache.5.html
[v1.1.3]: https://github.com/mustache/spec/tree/v1.1.3
[spec]: https://github.com/mustache/spec

[![Build Status](https://travis-ci.org/maghoff/mustachio.svg?branch=master)](https://travis-ci.org/maghoff/mustachio)

Getting started
===============

    const mustachio = require('mustachio');

    const mu = new mustachio.resolver();

    mu("demo", { name: "World" }).stream().pipe(process.stdout);

And then, in a directory `templates`, create the file `demo.mustache`:

    Hello, {{name}}!

Running this program outputs:

    Hello, World!

If you want to use this together with [Express][express], see [mustachio-middleware][middleware].

[express]: http://expressjs.com/
[middleware]: https://www.npmjs.com/package/mustachio-middleware

Why Mustachio?
==============
Mustachio is streaming, whereas other templating engines usually are blocking.
Traditionally, when serving a web request, the control flow is a sequence of
three discrete steps:

 1. Input: Collect all the requisite data from the database, filesystem or
    other any other sources
 2. Rendering: Pass the data and (compiled) template to the templating engine
    to render the full response
 3. Output: Send the rendered response to the client

In this model, no output can happen before the rendering is finished, and no
rendering or output can happen before all the data has been collected. This is
often good enough! However, a streaming model offers greater flexibility, as
we will see.

In Mustachio these three steps happen interleaved, in a streaming fashion.
This means rendering can proceed as soon as the relevant data becomes
available. Consequently, Mustachio will be able to respond immediately to many
requests. It also means flow control works, so rendering and gathering of
input data is suspended if the client can not keep up. This frees up resources
for handling other requests.

The [examples][examples] directory contains examples that highlight different
qualities of the streaming model:

 * [large-response][large-response] demonstrates flow control
 * [file-browser][file-browser] demonstrates rendering with data that
   asynchronously becomes available

[examples]: https://github.com/maghoff/mustachio/tree/master/examples
[large-response]: https://github.com/maghoff/mustachio/tree/master/examples/large-response
[file-browser]: https://github.com/maghoff/mustachio/tree/master/examples/file-browser
