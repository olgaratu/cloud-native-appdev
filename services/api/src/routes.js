const express = require('express');
const routes = express.Router();


// TODO Exercise 1: Implement healthcheck path GET /healthz
// ...

// TODO Exercise 2 "Resiliency": Simulate service failure
// ...

routes.post('/content-request', async (req, res) => {
    const contentRequest = req.body;

    // Simple validation - check for existence of languaeg and fields
    if (!contentRequest.language || !contentRequest.fields) {
        return res.status(400).send('Invalid content request.');
    }

    // TODO Exercise 2: Use axios to send the content request to the content service
    // -- replace the dummy response below
    // ...

    // TODO Exercise 4: Send messages to SNS via the AWS SDK for SNS (according to example in exercise description)
    // ...

    // Send a response back to the client
    res.status(200).send('Successful (dummy) response with status 200');

});

routes.get('/content-request/:id', async (req, res) => {

    // TODO Exercise 3: Fetch an existing request
    // -- replace the dummy response below
    // ...
    res.status(404).send("Call to content service needs to be implemented.")

});

module.exports = routes;