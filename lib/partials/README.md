Interface
=========
The interface of a partials resolver is one function, `get(id)`. It takes a
partials ID and returns a `Promise` that resolves to a parsed template.

To parse a template, call `require('mustachio/lib/parser')(templateString)`.

For a full example of a simple partials resolver, see [InMemory][InMemory].

[InMemory]: https://github.com/maghoff/mustachio/blob/master/lib/partials/in-memory.js

Implementations
===============
    const partials = require('mustachio').partials;

`partials.InMemory`
-------------------
    new partials.InMemory({
      "partial-id": "template-string",
      ...
    })

Resolves partials in memory, by mapping from the ID to the corresponding
template string given to the constructor.

`partials.FsNoCache`
--------------------
    new partials.FsNoCache([root, [suffixes]])

`root` defaults to the `templates` subdirectory of your project directory.

`suffixes` defaults to `[ '.mustache', '.mu', '.mu.html', '.html' ]`.

`FsNoCache` looks in the `root` directory for filenames of the form
`{{id}}{{suffix}}` for the given partials ID and all given `suffixes`. The
first match wins.

`FsNoCache` reads the partial from the file system on every invocation and as
such is not very efficient.

`partials.Fs`
-------------
    new partials.Fs([root, [suffixes]])

Works exactly like `FsNoCache`, except it additionaly has a caching layer. The
compiled partials are cached indefinitely. As such, this partials resolver can
be a good choice for a production environment.

It is possible to purge partials from this cache by calling `.purge(id)`.

`partials.FsWatch`
------------------
    new partials.FsWatch([root, [suffixes]])

Works exactly like `Fs`, except it additionally does automatic purging. When
resolving a partial, `FsWatch` also sets up a notification with `fs.watch` to
be notified if the file changes on disk. Whenever a partial changes on disk, it
is purged from the internal cache. This makes `FsWatch` suitable for
development environments and not bad for production environments.

It is possible to explicitly purge partials from this cache by calling
`.purge(id)`.
