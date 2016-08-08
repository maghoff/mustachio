This example demonstrates rendering with data that is streamed from a
PostgreSQL database.

Running
=======
You will need access to a running PostgreSQL instance to get this example to
work. The connection to PostgreSQL must be configured by the environmental
variables `PGUSER`, `PGDATABASE`, `PGPASSWORD` and/or `PGPORT`.

    npm install
    PGUSER=... PGPASSWORD=... ./postgres-query-stream.js

To connect to the database server via unix named sockets (this is what happens
when you just run `psql`):

    PGHOST=/var/run/postgresql ./postgres-query-stream.js

You should now be able to load the page at `http://127.0.0.1:8080`. Notice that
it loads incrementally, instead of waiting for the entire response from the
database. This could be put to good use for rendering any list of things from
the database.
