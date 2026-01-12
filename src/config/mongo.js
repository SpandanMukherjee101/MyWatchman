const mongoose = require("mongoose");
const { MongoClient, GridFSBucket } = require("mongodb");

const mongoUri = process.env.MONGO_URI || "mongodb://mongo:27017/myimages";
let gfsBucket;

const connectMongo = async () => {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");

    // Set up GridFS bucket
    const db = mongoose.connection.db;
    gfsBucket = new GridFSBucket(db, { bucketName: "uploads" });
  } catch (error) {
    console.error("MongoDB connection failed", error);
  }
};

module.exports = { connectMongo, gfsBucket };
