Mustachio is an experimental pull-based implementation of the Mustache templating language.

This implementation is tested against [version 1.1][v1.1.3] of [the Mustache spec][spec] and is presently mostly compliant.

[v1.1.3]: https://github.com/mustache/spec/tree/v1.1.3
[spec]: https://github.com/mustache/spec

[![Build Status](https://travis-ci.org/maghoff/mustachio.svg?branch=master)](https://travis-ci.org/maghoff/mustachio)

To test the streaming nature of Mustachio, run `example/http-server.js` in one terminal session and `curl http://localhost:8000/ | less` in another. As buffers in that pipeline get filled, eventually flow control will kick in and stop the node process from generating more output, until the buffers have been sufficiently drained. Inspect that `node` is not consuming CPU in this state. Compare the response times for `curl http://localhost:8000/ | less` and `curl http://localhost:8000/ >/dev/null`.
