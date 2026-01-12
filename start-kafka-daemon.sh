#!/bin/bash
KAFKA_HOME="$HOME/kafka_2.13-4.1.1"

echo "Starting Kafka in background..."

# The -daemon flag runs it in the background
$KAFKA_HOME/bin/kafka-server-start.sh -daemon $KAFKA_HOME/config/kraft/server.properties

echo "Kafka started! Logs are writing to $KAFKA_HOME/logs/server.log"
