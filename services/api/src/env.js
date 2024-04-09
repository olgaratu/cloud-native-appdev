const env = require('env-var');

const port = env.get('PORT').default('80').asPortNumber();

// TODO Exercise 4: Parse and export the name of the topic
// ...
const {
    requestsTopic
} = JSON.parse(process.env.COPILOT_SNS_TOPIC_ARNS);

module.exports = {
    port,
    requestsTopic
};