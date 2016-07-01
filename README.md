Mustachio is an experimental pull-based implementation of [the Mustache templating language][mustache]. It is fully compliant with [version 1.1][v1.1.3] of [the Mustache spec][spec].

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
