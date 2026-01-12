const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "watchman",
  brokers: ['localhost:9092']
});

const producer = kafka.producer({ 
  allowAutoTopicCreation: true,
  compression: "lz4"
});
const consumer = kafka.consumer({ groupId: "watchman-group" });
const admin = kafka.admin();

const connectKafka = async () => {
  try {
    await admin.connect();

    await admin.createTopics({
      topics: [
        {
          topic: "watchman-topic",
          replicationFactor: 1,
        },
      ],
    });

    await admin.disconnect();

    await producer.connect();
    await consumer.connect();

    console.log("✅ Kafka connected (producer + consumer)");
  } catch (error) {
    console.error("❌ Kafka connection failed", error);
  }
};

module.exports = { producer, consumer, connectKafka };
