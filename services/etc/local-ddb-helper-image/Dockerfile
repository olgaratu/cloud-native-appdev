FROM python:3.8-slim

RUN apt-get update && \
    apt-get install -y awscli netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

COPY init-dynamodb.sh /scripts/init-dynamodb.sh
RUN chmod +x /scripts/init-dynamodb.sh
