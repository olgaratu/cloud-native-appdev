const env = require('env-var');

const port = env.get('PORT').default('80').asPortNumber()
const isLocal = !env.get('COPILOT_SERVICE_NAME').asString();
const ddbTable = env.get('CONTENT_NAME_DDB_TABLE_NAME').asString()

module.exports = {
    port,
    isLocal,
    ddbTable
};