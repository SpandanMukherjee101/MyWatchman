require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectMongo } = require("./config/mongo");
const { connectKafka, consumer } = require("./config/kafka");
const { setupDatabase } = require("./queries/postgresQueries");
const { startConsumer } = require("./controllers/consumer");
const { watchWatchmen } = require("./controllers/producer");
const { httpServer, io } = require("./config/socket");
const routes = require("./routes/routes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/v1", routes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

const startServer = async () => {
  try {
    await connectMongo();
    await connectKafka();
    await setupDatabase();
    watchWatchmen();
    await startConsumer(consumer);

    const PORT = process.env.PORT || 5000;
    // Attach the Express app to the HTTP server so routes are served
    httpServer.on("request", app);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
