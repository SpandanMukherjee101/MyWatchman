#!/bin/bash

# Define your Kafka Home directory explicitly so this runs from anywhere
KAFKA_HOME="$HOME/kafka_2.13-4.1.1"

echo "Starting Kafka in KRaft mode..."
exec $KAFKA_HOME/bin/kafka-server-start.sh $KAFKA_HOME/config/kraft/server.properties
