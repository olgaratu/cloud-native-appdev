const express   = require('express');
const { storeRequest, fetchRequestById } = require('./ddb');

const routes = express.Router();

routes.post('/request', async (req, res) => {

    const incomingContentRequest = req.body;

    // Use the storeRequest function from ddb.js to store the content request
    const response = await storeRequest(incomingContentRequest);

    console.log('Stored content request with id: ', response.data)

    // Send the response received from ddb.js
    res.status(response.status).send(response.data);
});

routes.get('/request/:id', async (req, res) => {
    const requestId = req.params.id;
    console.log('Fetching content request with id:', requestId);

    // Use the fetchRequestById function from ddb.js to fetch the request
    const response = await fetchRequestById(requestId);

    // Send the response received from ddb.js
    res.status(response.status).send(response.data);
});


module.exports = routes;