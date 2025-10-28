#!/bin/bash

# wait-for-opa.sh - Wait for OPA to be ready

HOST=$1
PORT=$2
TIMEOUT=${3:-30}

echo "Waiting for OPA at $HOST:$PORT to be ready..."

for i in $(seq 1 $TIMEOUT); do
    if nc -z $HOST $PORT; then
        echo "OPA is ready!"
        exit 0
    fi
    echo "Waiting for OPA... ($i/$TIMEOUT)"
    sleep 1
done

echo "Timeout waiting for OPA at $HOST:$PORT"
exit 1 