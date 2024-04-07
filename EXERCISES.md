# Exercises
Description of exercises for the _Translation Management Systems (TMS)_ sample application implemented during the workshop __Cloud Native Application Development with AWS Container Services__.

**Make sure to read and follow the instructions for each exercise carefully!**

## Aborting Deployment
If an error occurs while deploying code (or if you just want to stop a deployment) with the AWS Copilot CLI, you may use _Ctrl+C_ to conduct a roll back.

## Exercise 1: TMS API 
In this exercise, an AWS Copilot [Load Balanced Web Service](https://aws.github.io/copilot-cli/docs/concepts/services/#load-balanced-web-service) for the _TMS API_ is created and deployed.

A basic API server exists in `src/api` with the following endpoint defined to accept a content-request request in `src/api/routes.js`:

    POST  /content-request
    

> The route just returns a (dummy) response for now. However, it requires a valid request (body) to pass a very simplified validation. An example of a valid request can be found in `test-data/request.json`



A Load Balanced Web Service must support _health checks_ and handle shutdowns gracefully:

*   Add a health check route for `GET /healthz` that simply responds with a status code of _200_ (OK).

*   Handle the SIGTERM signal for graceful shutdown.

    This [article](https://aws.amazon.com/blogs/containers/graceful-shutdowns-with-ecs/) describes graceful shutdown in AWS ECS - search "Node handler" for a Node example. 
    
    **[Close](https://nodejs.org/api/http.html#serverclosecallback) the Express server upon shutdown** (and add a log message to indicate that this occurs).

Test the containerized API server by:

*   Navigate to the `services/api` folder and build its Docker image:

        docker build -t tms-api:v1 . 

*   Run a container:

        docker run -d -p 80:80 tms-api:v1

*   Verify that the API server works by sending a request to one of the endpoints. 

        // Use this if executed in the root folder, otherwise modify the path to the test-data folder
        curl -X POST http://localhost/content-request -H "Content-Type: application/json" -d @test-data/request.json
        
        // No data is required for healthcheck
        curl http://localhost/content-request/healthz

*   Stop the container by running:

        docker stop <CONTAINER_ID>

    > Get the CONTAINER_ID via `docker ps`.

*   Check that the API server was shut down gracefully (your shutdown message should've been logged):

        docker logs <CONTAINER_ID>

*   Remove the container and image (locally):

        docker rm <CONTAINER_ID>
        docker rmi tms-api:v1

### Deployment
Create a Copilot application by running:

    copilot app init

in the **project root folder** and following the instructions.

> Note: The name of the _application_ should be `tms`.
> > _During all copilot oerations you can follow the progress and see the results in AWS Console > Cloudformation > Stacks_

Next, create and deploy a **test** environment for our application:

    copilot env init --name test

> Select `[profile default]` for credentials, and `Yes, use default` (for configuration of the new environment) when prompted.

    copilot env deploy --name test


**Before you continue, examine the contents of the newly created folder copilot/. This is where AWS Copilot stores all configuration.**


Next, create the _TMS API_ service:

    copilot svc init --name api --svc-type "Load Balanced Web Service" --dockerfile services/api/Dockerfile

Open `copilot/api/manifest.yml` and change:

*   The path for the [health check](https://aws.github.io/copilot-cli/docs/manifest/lb-web-service/#http-healthcheck) to `/healthz`. 

Finally, run:

    copilot svc deploy --name api

Test the API running on AWS by invoking the Load Balanced Web Service URL and the aforementioned API endpoints  (replace `AWS_LB_URL` with your Load Balanced Web Service URL).

    curl http://<AWS_LB_URL>/healthz

    // Use this if executed in the root folder, otherwise modify the path to the test-data folder
    curl -X POST http://<AWS_LB_URL>/content-request -H "Content-Type: application/json" -d @test-data/request.json
    
> Tip: To get info about a service, such as the Load Balanced Web Service URL, run `copilot svc show`.

## Exercise 2: Service-to-Service Communication
In this exercise, an AWS Copilot [Backend Service](https://aws.github.io/copilot-cli/docs/concepts/services/#backend-service) for the _TMS Content_ service is created and deployed.

The _TMS Content_ service will be invoked directly (synchronously) by the _TMS API_.

In the `services/api` folder:

*   In `src/routes.js`, for the available routes, use the `axios` library to make the required call to the _TMS Content_ service (the endpoint `/request`). 

    > Note: The URL of the _TMS Content_ service will be: `http://content`.

In the `services/content` folder:

*   In `src/index.js`, add SIGTERM handling, just like you did for the _TMS API_ service in the previous exercise. 

*   Examine `src/routes.js` and `src/ddb.js`. Currently, a dummy id will be returned since we don't have established connection to DyanomDB, but that will do for now - we will setup DynamoDB later.

You can use [Docker Compose](https://docs.docker.com/compose/) to locally test the interaction between the two services:

*   Update the existing docker compose file located in `services/etc/` - add your services as below:

    ```
        api:
            build: ../api/
            ports:
                - "80:80"
        content:
            build: ../content
    ```

    This sets up two services named `api` and `content`.


*   Launch the two services (from the `etc` folder):
           
        docker compose -f docker-compose-ex2.yaml up --build

*   In a second terminal window, invoke the API server:

        // Use this if executed in the root folder, otherwise modify the path to the test-data folder
        curl -X POST http://localhost/content-request -H "Content-Type: application/json" -d @test-data/request.json

    In the first terminal windows (where Docker Compose is running), you should see a log statement from the _TMS Content_ service, indicating that service-to-service communication was successful.

*   Ctrl+C to shut down Docker Compose.

To create and deploy the _TMS Content_ service, in the **project root** folder:

*   Create the _TMS Content_ service:

        copilot svc init --name content --svc-type "Backend Service" --dockerfile services/content/Dockerfile 

*   Deploy the _TMS Content_ service:

        copilot svc deploy --name content

*   Redeploy the _TMS API_ service:

        copilot svc deploy --name api

*   Invoke your updated API server (replace `AWS_LB_URL` with your Load Balanced Web Service URL):

        // Use this if executed in the root folder, otherwise modify the path to the test-data folder
        curl -X POST http://__HOST__/content-request -H "Content-Type: application/json" -d @test-data/request.json
         

*   Check the logs of the _TMS Content_ service to see that it's handled a request from _TMS API_:

        copilot svc logs --name content


### Resiliency (optional)
ECS load balancers efficiently distribute incoming network traffic across multiple instances, enhancing fault tolerance. If a request is sent to an instance that fails or becomes unresponsive, the load balancer automatically reroutes the request to another healthy instance. 

You can enable and observe this as follows:

*   Increase the [number](https://aws.github.io/copilot-cli/docs/manifest/lb-web-service/#count) of _TMS API service_ instances to **2** in `copilot/content/manifest.yml`. 

*   In the `services/api` folder, add a route (POST) `/toggle-health` in `src/routes.js` that toggle between healthy and unhealthy. Also replace the existing healthcheck endpoint with the code below.

        let isHealthy = true;
        let healthTimeout;

        routes.get('/healthz', (req, res) => {
            if (isHealthy) {
                res.status(200).send('Service is healthy');
            } else {
                res.status(500).send('Service is unhealthy');
            }
        });

        routes.post('/toggle-health', (req, res) => {
            isHealthy = !isHealthy;

            // Clear any existing timeout to avoid multiple resets
            clearTimeout(healthTimeout);

            // If the service is now unhealthy, set it to automatically recover after 2 minutes
            if (!isHealthy) {
                healthTimeout = setTimeout(() => {
                    isHealthy = true;
                    console.log('Automatically set health to true after 2 minutes');
                }, 120 * 1000);
            }

            res.status(200).send(`Health toggled. Current state: ${isHealthy ? 'healthy' : 'unhealthy'}`);
        });


*   Redeploy the _TMS API_ service:

        copilot svc deploy --name api

Once redeployment is finished: 

*   Toggle the health status for one of the instance

        curl -X POST http://<AWS_LB_URL>/toggle-health

    > `<AWS_LB_URL>` is again the Load Balanced Web Service URL for the _TMS API_. 

*   Send a number of requests, either manually or by using a command line tool as `ab`:

        sudo apt update
        sudo apt install apache2-utils

        # confirm installation
        ab -v

        # execute 
        ab -n 10 -T application/json -p test-data/request.json http://<AWS_LB_URL>/content-request

In the AWS Console, view the logs for the _TMS API_ service (and its two tasks). You should see that after you've toggled the health, _all_ subsequent requests are forwarded to the healthy task.


## Exercise 3: Introducing Storage
In this exercise we will introduce a DynamoDB table for persistent storage of our content requests. 

### Local setup and configuration
To be able to verify locally we will add a local DynamoDB instance to our docker-compose set-up from the previous exercise. 

* First, in the `services/content` folder, in the file `src/ddb.js`, implement functionality to store the content request in DynamoDB. You can find example code in the [developerguide at AWS.](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/example_dynamodb_PutItem_section.html)

    Let the service, after the content request is stored, return the `id`

        return { status:201, data:{id} };


*   Uncomment the configurations for `dynamododb-local` and `init-dynamodb` in `/services/etc
/docker-compose-ex2.yaml`. Also Add the lines below for the _TMS Content_ service to make the `CONTENT_NAME_DDB_TABLE_NAME` env variable accessible from the service.

        environment:
          - CONTENT_NAME_DDB_TABLE_NAME=${CONTENT_NAME_DDB_TABLE_NAME}
     
    _Note. The `init-dynamodb` service is a helper container that only runs once to set up the db for local use._

    
*   Launch the services the same way as before (from the `etc` folder). This time, three services will be launched.      
    
        docker compose -f docker-compose-ex2.yaml up --build

*  Verify that the database table is created (empty) by executing the following command

        aws dynamodb scan --table-name LOCAL_DDB --endpoint-url http://localhost:8000

*  To test communication between the api and the storage, first, create a new content request:

        curl -X POST http://localhost/content-request -H "Content-Type: application/json" -d @test-data/request.json       

    Verify that the content request is stored locally by executing the `aws dynamodb scan ...` command again.


*  Almost done. Now, in the `services/api` folder, in `src/routes.js`, once again use the `axios` library to implement functionality for fetching an existing request in the `/content-request/:id'` route. 


*  Ctrl+C to shut down Docker Compose, then rebuild and restart using `docker compose -f docker-compose-ex2.yaml up --build`


*  Since our local DynamoDB doesn't persist content between restarts of docker compose, create a new content request as before

        curl -X POST http://localhost/content-request -H "Content-Type: application/json" -d @test-data/request.json


* Finally, test your And then use the api to fetch the request /replace the ID with the id you received from the POST request:

        curl http://localhost/content-request/__REQUEST_ID__
    
    _Once done, shut down Docker Compose._


### Deployment to AWS
Now, when our services are verified locally it's tim to create the DynamoDB table in AWS and later redeploy our services. Read about how persistence can be added by AWS Copilot on the [Storage page](https://aws.github.io/copilot-cli/docs/developing/storage/)

* Begin with creating a DynamoDB table using AWS Copilot. Remember to be in the **project root folder** :

      copilot storage init -n Content -t DynamoDB -w content -l environment --partition-key requestId:S 

    _Answer 'No' on the question about adding sort keys._


* Deploy the updated environment (including the new DynamoDB table)

        copilot env deploy --name test


* Then redeploy the `content`, and thereafter the 'api'-service

        copilot svc deploy --name content

        copilot svc deploy --name api


* When everything is deployed, test by issuing some requests. In `AWS Console -> DynamoDB` you can see the persisted data.
    
        curl -X POST http://<AWS_LB_URL>/content-request -H "Content-Type: application/json" -d @test-data/request.json

        curl http://<AWS_LB_URL>/content-request/__REQUEST_ID__



## Exercise 4: PubSub
In this exercise, a [Worker Service](https://aws.github.io/copilot-cli/docs/concepts/services/#worker-service) for processing content-request requests is created and deployed.

The _TMS API_ service will be modified to act as the _publisher_ of content-request requests.

### TMS Processor (Worker Service / subscriber)
The sample code in the [documentation](https://aws.github.io/copilot-cli/docs/developing/publish-subscribe/#javascript-example_1) illustrates how to implement a SQS subscriber.

> Make sure you change the region to match yours.

> Notice the `COPILOT_QUEUE_URI` environment variable - this is the address of the queue from which content-request requests are be consumed and processed (it's also available via `env.queueUrl` - see `services/processor/src/env.js`).

The sample code in the documentation currently does not run repeatedly to consume requests from the queue (it does so only once).

Your task is to implement continuous request processing in `services/processor/src/index.js` by following the _TODOs_ and comments.

When done, test the processor locally by:

*   Create a new SQS queue using the AWS Console; copy the queue URI (referred to as `<MY_QUEUE_URI>` below).

*   Run the processor (in `services/processor`):

        npm install

        COPILOT_QUEUE_URI=<MY_QUEUE_URI> node src/index.js

*   In the AWS Console, send a message to the queue with the following body:

        {"Message":"1234"}

    The processor should log the received message.

*   Ensure that Ctrl+C ends the loop and thereby shuts down the processor gracefully.

    > What is the (estimated) maximum duration for the processor to terminate?

### TMS API (publisher)
Modify `copilot/api/manifest.yml` to allow the _TMS API_ to publish requests to the queue (see more [here](https://aws.github.io/copilot-cli/docs/developing/publish-subscribe/#sending-messages-from-a-publisher)):

> Name your topic __requestsTopic__.

In `services/api`:

*   Modify `src/env.js` to parse and export the name of the topic (also an environment variable):

        const {
            requestsTopic
        } = JSON.parse(process.env.COPILOT_SNS_TOPIC_ARNS);

        module.exports = {
            port,
            requestsTopic // <---
        };

*   In `src/routes.js`, for the POST route, publish a request to the queue using the [documentation's sample code](https://aws.github.io/copilot-cli/docs/developing/publish-subscribe/#javascript-example) as a starting point.

    > Remember to change the SNS client to be your region!

    > Instead of the `Message` being `"hello"`, set it to the ID returned by the call to the _TMS Content_ service.

### Deployment
In the **project root** folder, deploy the changes to the _TMS API_ service:

    copilot svc deploy --name api

Add the new `processor` Worker Service:

    copilot svc init --name processor --svc-type "Worker Service" --dockerfile services/processor/Dockerfile

> Make sure that the suggested `requestsTopic` is selected - marked as [x] by pressing space!

    copilot svc deploy --name processor

After deployment, follow the logs of the `processor` Worker Service in realtime:

    copilot svc logs --name processor --follow

When POSTing a new content-request request to `http://<AWS_LB_URL>/content-request`, you should see the `processor` Worker Service logging the request ID shortly thereafter.

### Service Autoscaling
The number of Worker instances can be dynamically and automatically adjusted based on a custom metric that takes into account _the average message processing time_ and _the acceptable latency_ (how long on average a message should remain in the queue before being consumed).

> Read more in the [documentation](https://aws.github.io/copilot-cli/docs/manifest/worker-service/#count-queue-delay) on using this "queue delay" scaling policy.

To enable autoscaling, in `copilot/services/processor`:

*   Set the range of instances to be between **1** (min) and **3** (max).

*   Set the `acceptable_latency` to be **10s** (for our purposes, this allows the autoscaling to commence faster).

*   Set the `msg_processing_time` to be **5s**.

    > How many "tasks per instance" does this amount to, and what does that imply in terms of the average amount of messages in the queue at any given time?

*   In `services/processor/src/index.js`, simulate a "processing time" of **1s** in the `processor` function, using the `delay` helper.

*   Redeploy the _TMS Processor_ service.

To observe autoscaling, send a large number of requests to _TMS API_:

    ab -n 50 -T application/json -p test-data/request.json http://<AWS_LB_URL>/content-request


After a while, AWS CloudWatch will trigger an alarm that will invoke the scaling policy; the maximum number of instances should now have been started.

## Exercise 5: Pipeline
In this exercise, you will create an automated [pipeline](https://aws.github.io/copilot-cli/docs/concepts/pipelines/) to build and deploy services to your _test_ environment.

In the **project root**, run:

    copilot pipeline init --name tms-pipeline

> Choose **Workloads** as the pipeline type, and **test** for your environment.

**Commit and push the changes (a `copilot/pipelines` folder has been added) to the repo.**

Run:

    copilot pipeline deploy

The connection between AWS and GitHub needs to be completed:

*   Navigate to https://console.aws.amazon.com/codesuite/settings/connections

*   Click "Update pending connection" and follow the steps.

To test the pipeline, make a change to a source file in any of the services, then commit and push the change; to follow the pipeline status, run:

    copilot pipeline status

You can also follow the progress in the AWS Console, go to **CodePipeline**.

## Cleanup
When finished with the exercise, remove the application and all deployed resources by running the following in the **project root**:

    copilot app delete
