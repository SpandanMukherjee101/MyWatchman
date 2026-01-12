const { io } = require("../config/socket");

const handleManagerConnection = (socket, id, area) => {
  const managerRoom = `manager:${id}`;
  const areaRoom = `area:${area}`;

  socket.join(managerRoom);
  socket.join(areaRoom);

  console.log(`👨‍💼 Manager ${id} connected to ${managerRoom}`);

  // Handle chat messages to area
  socket.on("chat_message", ({ message }) => {
    if (!message) return;
    if (areaRoom)
      io.to(areaRoom).emit("new_chat_message", {
        sender: id,
        message,
        timestamp: new Date().toISOString(),
      });
    console.log(`💬 [${area || "N/A"}] Manager ${id}: ${message}`);
  });

  // Handle full audio messages to area
  socket.on("audio_message", ({ audioBase64 }) => {
    if (!audioBase64) return;
    io.to(areaRoom).emit("new_audio", {
      sender: id,
      audioBase64,
      timestamp: new Date().toISOString(),
    });
    console.log(`🎤 Manager ${id} sent audio`);
  });

  // Handle streamed audio chunks to specific watchman
  socket.onAny((event, data) => {
    if (event.startsWith("Manager:")) {
      const wid = parseInt(event.split("Manager:")[1], 10);
      if (!isNaN(wid)) {
        io.to(managerRoom).emit(`waudio:${wid}`, {
          sender: id,
          audioBase64: data?.audioBase64,
          chunk: data?.chunk,
          index: data?.index,
          totalChunks: data?.totalChunks,
          timestamp: new Date().toISOString(),
        });
        console.log(
          `🎧 Manager ${id} streaming chunk to Watchman ${wid}`
        );
      } else {
        console.warn(`⚠️ Invalid Watchman ID in event name: ${event}`);
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`❌ Manager ${id} disconnected`);
  });
};

module.exports = { handleManagerConnection };
