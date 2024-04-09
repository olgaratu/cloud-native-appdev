const { DynamoDBClient  } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand  } = require("@aws-sdk/lib-dynamodb");
const env       = require('./env');
const crypto = require('crypto');

console.log('env.isLocal',env.isLocal)
// Create a new DynamoDB client
const dynamoDbClientConfig = {
    region: 'eu-north-1',
    endpoint: env.isLocal ? 'http://dynamodb-local:8000' : undefined,
    credentials: env.isLocal ? {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy'
    } : undefined
};
const client = new DynamoDBClient(dynamoDbClientConfig);
const docClient = DynamoDBDocumentClient.from(client);

async function storeRequest (requestData) {
    const id = crypto.randomUUID();

    if (!env.ddbTable)
        return { status: 200, data: { "id": `dummy-${id}-dummy` } };


    // TODO Exercise 3: Store the request to dynamoDB
    // ...
    const item = {
        TableName: env.ddbTable,
        Item: {
            requestId: id,
            data: {
                ...requestData,
                state: 'pending',
                ts: new Date().toISOString()
            }
        }
    };

    try {
        await docClient.send(new PutCommand(item));
        return { status: 201, data: { id } };
    } catch (error) {
        console.error("Error saving data to DynamoDB", error);
        return { status: 500, data: 'Error storing resource' };
    }
}

async function fetchRequestById(requestId) {

    const params = {
        TableName: env.ddbTable,
        Key: {
            requestId: requestId
        }
    };

    try {
        const { Item } = await docClient.send(new GetCommand(params));
        return Item ? { status: 200, data: {
                ...Item.data,
                requestId: Item.requestId
                }}
            :
                { status: 404, data: 'Not Found' };
    } catch (error) {
        console.error("Error fetching data from DynamoDB", error);
        return { status: 500, data: 'Error fetching resource' };
    }
}

module.exports = { storeRequest, fetchRequestById };
