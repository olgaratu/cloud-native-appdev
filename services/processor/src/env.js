const env = require('env-var');

const queueUrl = env.get('COPILOT_QUEUE_URI').required().asString();

COPILOT_QUEUE_URI = "https://sqs.eu-north-1.amazonaws.com/975050093532/TMS"

module.exports = {
    queueUrl
};