// config/db.js
// Connects the backend to MongoDB using Mongoose.
// The connection string comes from MONGO_URI in the .env file (it contains a password).

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host} (database: ${conn.connection.name})`);
  } catch (error) {
    // Common causes: wrong password, IP not allowed in Atlas, no internet
    console.error(`ERROR: Could not connect to MongoDB: ${error.message}`);
    process.exit(1); // stop the server; it can't work without the database
  }
};

// For the health check: is the database connected right now?
const getDatabaseStatus = () =>
  mongoose.connection.readyState === 1 ? "connected" : "disconnected";

module.exports = { connectDB, getDatabaseStatus };
