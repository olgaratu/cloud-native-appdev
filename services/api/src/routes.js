const express = require('express');
const axios     = require('axios').default;

const routes = express.Router();

routes.post('/content-request', async (req, res) => {
    const contentRequest = req.body;

    // Simple validation
    if (!contentRequest.language || !contentRequest.fields) {
        return res.status(400).send('Invalid request structure');
    }

    // TODO Exercise 2: Use axios to send the content request to the content service
    // ...
    try {
        const response
            = await axios({
            method: 'POST',
            url: 'http://content/request',
            data: contentRequest,
            headers: {
                'Content-Type': 'application/json'
            }

        });

        const request
            = response.data;

        console.log(`RequestId received from Content Service: '${request.id}'`);

        res.send(request);
    } catch (error) {
        console.error('Error storing contentRequest', error);
        res.status(500).send('Error storing contentRequest');
    }

});

// TODO Exercise 3: Fetch an existing request
routes.get('/content-request/:id', async (req, res) => {
    const requestId = req.params.id;

    try {
        const response = await axios.get(`http://content/request/${requestId}`);
        res.send(response.data);
    } catch (error) {
        console.error(`Error fetching contentRequest with id ${requestId}:`, error);
        res.status(500).send(`Error fetching contentRequest with id ${requestId}`);
    }
});

    // ORIGINAL
/*routes.post('/content-request', async (req, res) => {
    const contentRequest = req.body;

    // Simple validation
    if (!contentRequest.language || !contentRequest.fields) {
        return res.status(400).send('Invalid content request.');
    }

    // Send a response back to the client
    res.status(200).send('Successful (dummy) response with status 200');
});*/



module.exports = routes;