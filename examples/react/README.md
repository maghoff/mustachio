This example demonstrates effective use of explicit flushing to combine
Mustachio and [React](https://facebook.github.io/react/).

There are two ways to effect a flush in Mustachio, so this directory contains
two entry point modules each demonstrating one way.

Running
=======
First, install dependencies:

    npm install

For testing the `{{_flush}}` tag included in a template, run

    ./react-template-flush.js

For testing the `stream.flush()` API, run

    ./react-code-flush.js

The problem
===========
When using React for server side rendering, there is still a bit of the web
page that has to be rendered some other way. React does not support rendering
of the header tags.

It is simple enough to put this into any template rendering system. However,
this usually leaves some performance on the table as it stalls the response
until the React component has been rendered. React components are often big
and on the scale of web requests they can take some time to render. If the
header were sent before starting to render the React components, it would
allow the client to request stylesheets and javascript dependencies
simultaneously, reducing the time until the entire page is ready on the client
side.

The solution
============
Ideally, we should be able to do this with Mustachio with no extra effort.
After all, Mustachio stream renders the template, and is finished with the
header before it reaches the React copmponent:

    <html>
    <head>
    <script src="{{large_js_dependency}}"></script>
    </head>
    <body>
    {{{react_component}}}
    </body>
    </html>

However, real world considerations make this slightly more involved. For
performance reasons it is imperative that Mustachio buffers its output in
chunks, and it does not know to flush the buffer before it reaches the React
component.

The solution here is to add an explicit buffer flush. Mustachio exposes two
different ways of achieving this:

Explicit flush in the template
------------------------------
`{{_flush}}` is a special purpose value you can include in Mustachio templates
to effect a buffer flush:

    <html>
    <head>
    <script src="{{large_js_dependency}}"></script>
    </head>
    <body>
    {{_flush}}
    {{! At this point, the header has been sent to the client }}
    {{{react_component}}}
    </body>
    </html>

Test the <react-template-flush.js> example to see this method in action.

Explicit flush in the code
--------------------------
The `stream` object has a function `flush()` which returns a `Promise`. When
the `Promise` resolves, the buffer has been flushed.

    const data = {
      react_contents: () => {
        return stream.flush() //< Explicit flush
          .then(() => {
            const element = reactComponent(React);
            return ReactDOMServer.renderToString(element);
          })
      }
    };

This method has the advantage that it keeps the template more free of logic
and side effects.

Test the <react-code-flush.js> example to see this method in action.
