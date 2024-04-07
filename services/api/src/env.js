const env = require('env-var');

const port = env.get('PORT').default('80').asPortNumber();

// TODO Exercise 4: Parse and export the name of the topic
// ...

module.exports = {
    port,
};