const { io } = require("../config/socket");
const jwt = require("jsonwebtoken");
const pool = require("../config/postgres");
const { handleWatchmanConnection } = require("../socketHandlers/watchmanHandlers");
const { handleManagerConnection } = require("../socketHandlers/managerHandlers");

const SECRET_KEY = process.env.SECRET_KEY || "abcd";

const _manager = async (id) => {
  try {
    const result = await pool.query(
      `SELECT manager_id FROM watchman WHERE id = $1`,
      [id]
    );
    return result.rows[0]?.manager_id;
  } catch (err) {
    console.error("❌ Error fetching manager:", err);
    throw new Error("Unable to fetch manager.");
  }
};

const watchWatchmen = () => {
  io.on("connection", (socket) => {
    const { token, shiftId, area } = socket.handshake.query;

    if (!token) {
      console.log("❌ Connection rejected — no token provided");
      socket.disconnect(true);
      return;
    }

    jwt.verify(token, SECRET_KEY, async (error, decoded) => {
      if (error) {
        console.log("❌ Invalid or expired token:", error.message);
        socket.disconnect(true);
        return;
      }

      const id = decoded.id;
      if (!id) {
        console.log("❌ Invalid user id in token");
        socket.disconnect(true);
        return;
      }

      if (shiftId) {
        const mid = await _manager(id);
        handleWatchmanConnection(socket, id, shiftId, area, mid);
      } else {
        handleManagerConnection(socket, id, area);
      }
    });
  });

  console.log("👀 Watching for Watchmen & Managers connections...");
};

module.exports = { watchWatchmen };
