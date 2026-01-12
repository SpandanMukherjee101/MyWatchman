const { io } = require("../config/socket");
const { producer } = require("../config/kafka");

const handleWatchmanConnection = (socket, id, shiftId, area, mid) => {
  const managerRoom = `manager:${mid}`;
  const areaRoom = `area:${area}`;
  const watchmanRoom = `watchman:${id}`;

  socket.join(managerRoom);
  socket.join(areaRoom);
  socket.join(watchmanRoom);

  console.log(
    `📡 Watchman ${id} joined rooms ${managerRoom}, ${areaRoom}, ${watchmanRoom}`
  );

  // Handle location updates to Kafka
  socket.on("location_update", async ({ lat, lon }) => {
    try {
      await producer.send({
        topic: "watchman-location",
        messages: [
          {
            value: JSON.stringify({
              watchman_id: id,
              shift_id: shiftId,
              lat,
              lon,
              timestamp: new Date().toISOString(),
              area,
            }),
          },
        ],
      });
    } catch (err) {
      console.error("❌ Kafka send failed:", err);
    }
  });

  // Handle chat messages to area
  socket.on("chat_message", ({ message }) => {
    if (!message) return;
    io.to(areaRoom).emit("new_chat_message", {
      sender: id,
      message,
      timestamp: new Date().toISOString(),
    });
    console.log(`💬 [${area}] Watchman ${id}: ${message}`);
  });

  // Handle full audio messages to area
  socket.on("audio_message", ({ audioBase64 }) => {
    if (!audioBase64) return;
    io.to(areaRoom).emit("new_audio", {
      sender: id,
      audioBase64,
      timestamp: new Date().toISOString(),
    });
    console.log(
      `🎤 Watchman ${id} sent final audio to area ${area}`
    );
  });

  // Handle streamed audio chunks to specific manager
  socket.on(`audio:${mid}`, ({ audioBase64, chunk, index, totalChunks }) => {
    if (!audioBase64 && !chunk) return;
    io.to(managerRoom).emit(`maudio:${mid}`, {
      sender: id,
      audioBase64,
      chunk,
      index,
      totalChunks,
      timestamp: new Date().toISOString(),
    });
    console.log(
      `🎧 Watchman ${id} streaming audio chunk to Manager ${mid}`
    );
  });

  // Handle direct chat message to another watchman
  socket.on("private_chat", ({ targetWatchmanId, message }) => {
    if (!message || !targetWatchmanId) return;
    const targetRoom = `watchman:${targetWatchmanId}`;
    io.to(targetRoom).emit("private_chat_message", {
      sender: id,
      senderId: id,
      message,
      timestamp: new Date().toISOString(),
    });
    console.log(`💬 Watchman ${id} sent direct message to Watchman ${targetWatchmanId}: ${message}`);
  });

  // Handle full audio message to another watchman
  socket.on("private_audio_message", ({ targetWatchmanId, audioBase64 }) => {
    if (!audioBase64 || !targetWatchmanId) return;
    const targetRoom = `watchman:${targetWatchmanId}`;
    io.to(targetRoom).emit("private_audio", {
      sender: id,
      senderId: id,
      audioBase64,
      timestamp: new Date().toISOString(),
    });
    console.log(`🎤 Watchman ${id} sent audio to Watchman ${targetWatchmanId}`);
  });

  // Handle streamed audio chunks to another watchman
  socket.on("private_audio_chunk", ({ targetWatchmanId, chunk, index, totalChunks }) => {
    if (!chunk || !targetWatchmanId) return;
    const targetRoom = `watchman:${targetWatchmanId}`;
    io.to(targetRoom).emit("private_audio_chunk", {
      sender: id,
      senderId: id,
      chunk,
      index,
      totalChunks,
      timestamp: new Date().toISOString(),
    });
    console.log(
      `🎧 Watchman ${id} streaming audio chunk to Watchman ${targetWatchmanId} (${index}/${totalChunks})`
    );
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`🛑 Watchman ${id} disconnected from ${managerRoom}`);
  });
};

module.exports = { handleWatchmanConnection };
