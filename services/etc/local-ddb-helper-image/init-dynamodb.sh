#!/bin/bash

# Wait for the local DynamoDB instance to be up
while ! nc -z dynamodb-local 8000; do
  sleep 0.1
done

# Create DynamoDB table
aws dynamodb create-table \
    --table-name $CONTENT_NAME_DDB_TABLE_NAME \
    --attribute-definitions AttributeName=requestId,AttributeType=S \
    --key-schema AttributeName=requestId,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --endpoint-url http://dynamodb-local:8000
