const express   = require('express');
const env       = require('./env');
const routes    = require('./routes');

const app = express();
app.use(express.json());
app.use('/', routes);

const server = app.listen(env.port, () => {
    console.log(`Listening on port ${env.port}`)
});


// TODO Exercise 2: Use Sigterm handling to shut down gracefully
// ...
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received, about to shut down TMS Content Service.');

    server.close(() => {
        console.log('TMS Content Service shut down gracefully.');

        // If any other connections and/or resources needs to be cleaned up,
        // this is the place to do it.

        process.exit(0);
    });
});
