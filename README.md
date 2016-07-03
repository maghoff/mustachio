Mustachio is a streaming pull-based implementation of [the Mustache templating
language][mustache]. It is fully compliant with [version 1.1][v1.1.3] of [the
Mustache spec][spec].

[mustache]: https://mustache.github.io/mustache.5.html
[v1.1.3]: https://github.com/mustache/spec/tree/v1.1.3
[spec]: https://github.com/mustache/spec

[![Build Status](https://travis-ci.org/maghoff/mustachio.svg?branch=master)](https://travis-ci.org/maghoff/mustachio)

Getting started
===============

    const mustachio = require('mustachio');

    const mu = mustachio.resolver();

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

 1. Input: Collect all the requisite data from the database, filesystem and any
    other sources
 2. Rendering: Pass the data (sometimes called "view") and (compiled) template
    to the templating engine to render the full response
 3. Output: Send the rendered response to the client

In this model, no output can happen before the rendering is finished, and no
rendering or output can happen before all the data has been collected. This is
often good enough! However, a streaming model offers greater flexibility and
can give better performance.

In Mustachio these three steps happen interleaved, in a streaming fashion.
This means rendering can proceed as soon as the relevant data becomes
available. Consequently, Mustachio will be able to respond immediately to many
requests. It also means flow control works, so rendering and gathering of
input data can be suspended when the client can not keep up. This frees up
resources for handling other requests.

The [examples][examples] directory contains examples that highlight different
qualities of the streaming model:

 * [large-response][large-response] demonstrates flow control
 * [file-browser][file-browser] demonstrates rendering with data that
   asynchronously becomes available

[examples]: https://github.com/maghoff/mustachio/tree/master/examples
[large-response]: https://github.com/maghoff/mustachio/tree/master/examples/large-response
[file-browser]: https://github.com/maghoff/mustachio/tree/master/examples/file-browser

API
===

    const mustachio = require('mustachio');

Using a template string
-----------------------
    const template = mustachio.string("Hello, {{name}}\n");
    const rendering = template.render({ name: "World" });

Stream render:

    rendering.stream().pipe(process.stdout);

Render to string:

    rendering.string().then(result => console.log(result));

Using templates from the file system
------------------------------------
    const resolver = mustachio.resolver();

    const rendering = resolver("template-name", { name: "World" });

This `rendering` object has `stream()` and `string()` methods just like the
`rendering` object above that we got from the template string.

The resolver uses the template ID you give in to locate a file in the file
system, under the directory `templates` in your project directory. It looks for
files with file extensions  `.mustache`, `.mu`, `.mu.html` and `.html` in that
order. The same mechanism is used to resolve partial includes.

When using the resolver, the compiled template is cached in memory and reused
when rendering the same template again. Additionally, a file system watcher is
set up to invalidate the cache whenever the template file is edited.

Customizing partials resolving
------------------------------
You can customize the base directory for templates and the file name suffixes
used for resolving partials by passing a configuration object to the resolver:

    const resolver = mustachio.resolver({
      root: path.join(__dirname, "my-templates"),
      suffixes: [ ".my.oh.my" ]
    });

To get other behaviour and even resolve partials from other sources than the
file system (such as the database, or HTTP calls), pass a custom partials
resolver object:

    const resolver = mustachio.resolver({
      partialsResolver: new CustomPartialsResolver()
    });

See [partials][partials] for details.

[partials]: https://github.com/maghoff/mustachio/tree/master/lib/partials

When using a template string, partials will by default not be resolved. To
enable partials resolving for such templates, pass a partials resolver to the
`render` function:

    template.render(data, partialsResolver);

The `data` object
-----------------
These are the values you can put in the `data` object:

### Numbers and strings ###
    {
      "number": 5.25,
      "desc": "is a number."
    }

`{{number}} {{desc}}` ⇒ `5.25 is a number.`

### Objects ###
    {
      "a": {
        "b": 5,
        "c": {
          "d": 6
        }
      }
    }

`{{#a}}{{b}}, {{c.d}}{{/a}}` ⇒ `5, 6`

### Arrays ###
    { "a": [1, 2, 3] }

`{{#a}}({{.}}){{/a}}` ⇒ `(1)(2)(3)`.

Those are the basic types. To make use of streaming data gathering, Mustachio
also offers some abstractions:

### Functions ###
    {
      "a": () => 5
    }

`{{a}}` ⇒ `5`

Functions get called with the containing object as the `this` argument:

    {
      "a": 5,
      "b": function () { return this.a * 2; }
    }

`{{b}}` ⇒ `10`

Functions can also return objects and arrays which will be treated as above.

### Generator functions ###
Generator functions will be treated as arrays:

    {
      "a": function* () {
        for (let i = 0; i < 3; ++i) {
          yield i;
        }
      }
    }

`{{#a}}({{.}}){{/a}}` ⇒ `(0)(1)(2)`

### Promises ###
    {
      "a": new Promise((resolve, reject) => {
        // Any asynchronous operation
        require('fs').stat(__dirname, (stat, err) => {
          if (err) reject(err);
          else resolve(stat);
        });
      })
    }

`{{#a.isDirectory}}A directory!{{/a.isDirectory}}` ⇒ `A directory!`

### Mix ###
The power of Mustachio comes from combining these building blocks. It works
perfectly well to specify a function that returns a promise which resolves to
a generator that yields functions which ... etc, etc.

See the [file-browser][file-browser] example for an effective use of this.
