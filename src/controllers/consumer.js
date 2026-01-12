// src/controllers/consumer.js
const pool = require("../config/postgres");
const { io, pubClient } = require("../config/socket");
const { calculateSteps } = require("../helpers/steps");
const { consumer } = require("../config/kafka");

let watchmanBuffer = {};

const getRedisKey = (watchman_id, shift_id) =>
  `watchman:${watchman_id}:shift:${shift_id}`;

const startKafkaConsumer = async (consumer) => {
  await consumer.subscribe({ topic: "watchman-location", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        const { watchman_id, shift_id, lat, lon, timestamp, area } = data;        

        if (!watchman_id || !shift_id || !lat || !lon || !timestamp) {
          console.warn("⚠️ Incomplete Kafka message:", data);
          return;
        }

        console.log("📨 Kafka received:", data);

        const redisKeyLast = `watchman:${watchman_id}:last`;
        const prev = await pubClient.hGetAll(redisKeyLast);

        let steps = 0;
        if (Object.keys(prev).length) {
          steps = calculateSteps(
            { lat: parseFloat(prev.lat), lon: parseFloat(prev.lon) },
            { lat, lon }
          );
        }

        const totalSteps = parseInt(prev.totalSteps || 0) + steps;

        await pubClient.hSet(redisKeyLast, { lat, lon, totalSteps });
        await pubClient.expire(redisKeyLast, 3600);

        const redisShiftKey = getRedisKey(watchman_id, shift_id);
        await pubClient.hSet(redisShiftKey, { lat, lon, steps: totalSteps, timestamp });
        await pubClient.expire(redisShiftKey, 3600);

        if (!watchmanBuffer[shift_id]) watchmanBuffer[shift_id] = [];
        watchmanBuffer[shift_id].push({
          watchman_id,
          shift_id,
          timestamp,
          steps: totalSteps,
          lat,
          lon,
        });

        if (watchmanBuffer[shift_id].length > 500)
          watchmanBuffer[shift_id].splice(0, 100);

        const result = await pool.query(
          `SELECT manager_id FROM watchman WHERE id = $1;`,
          [watchman_id]
        );
        const manager_id = result.rows[0]?.manager_id;

        // Emit updates directly to rooms. Do NOT register connection handlers per message.
        if (manager_id) {
          io.to(`manager:${manager_id}`).emit("watchman_update", {
            watchman_id,
            shift_id,
            lat,
            lon,
            steps: totalSteps,
            timestamp,
          });
        }

        if (area) {
          io.to(`area:${area}`).emit("watchman_area_update", {
            watchman_id,
            shift_id,
            lat,
            lon,
            steps: totalSteps,
            timestamp,
          });
        }
  
      } catch (err) {
        console.error("❌ Error processing Kafka message:", err.message);
      }
    },
  });

  console.log("📥 Kafka consumer listening on topic: watchman-location");
};

const startBatchInsertLoop = () => {
  setInterval(async () => {
    console.log("⏰ Batch insert loop triggered", new Date().toISOString());

    try {
      const shifts = Object.keys(watchmanBuffer);
      if (shifts.length === 0) return;

      for (const shift_id of shifts) {
        const records = watchmanBuffer[shift_id];
        if (!records?.length) continue;

        const placeholders = records
          .map(
            (_, i) =>
              `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, ST_SetSRID(ST_MakePoint($${i * 6 + 5}, $${i * 6 + 6}), 4326))`
          )
          .join(", ");

        const sql = `
          INSERT INTO log (watchman_id, shift_id, timestamp, steps, location)
          VALUES ${placeholders}
          ON CONFLICT DO NOTHING;
        `;

        const params = records.flatMap((r) => [
          r.watchman_id,
          r.shift_id,
          r.timestamp,
          r.steps,
          r.lon,
          r.lat,
        ]);

        const start = Date.now();
        await pool.query(sql, params);
        console.log(`💾 Inserted ${records.length} logs for shift ${shift_id} in ${Date.now() - start}ms`);
      }

      watchmanBuffer = {};
    } catch (err) {
      console.error("❌ Batch insert failed:", err.message);
    }
  }, 60 * 1000);
};

const startConsumer = async () => {
  console.log("🚀 Starting Kafka consumer...");
  try {
    await startKafkaConsumer(consumer);
    startBatchInsertLoop();
    console.log("✅ Kafka consumer and batch loop active.");
  } catch (err) {
    console.error("❌ Consumer startup failed:", err.message);
  }
};

module.exports = { startConsumer };
