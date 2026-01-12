#!/bin/bash
KAFKA_HOME="$HOME/kafka_2.13-4.1.1"
echo "Stopping Kafka..."
$KAFKA_HOME/bin/kafka-server-stop.sh
