const { createServer } = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASSWORD || "";

const pubClient = createClient({
  url: `redis://${redisHost}:${redisPort}`,
  password: redisPassword,
});
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log(`✅ Redis connected to Socket.IO at ${redisHost}:${redisPort}`);
  })
  .catch((err) => console.error("❌ Redis connection failed:", err));

module.exports = { httpServer, io, pubClient };
