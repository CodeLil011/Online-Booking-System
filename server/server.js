// server.js
// Entry point of the backend. It creates the Express app, sets up middleware,
// connects route files, connects to MongoDB, and starts the server.

// 1. Load environment variables from the .env file into process.env
require("dotenv").config();

// Stop immediately if a required setting is missing
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is missing in the .env file.");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI is missing in the .env file.");
  process.exit(1);
}

// 2. Import packages
const express = require("express");
const cors = require("cors");

// 3. Import our own files
const { connectDB, getDatabaseStatus } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const tableRoutes = require("./routes/tableRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const customerRoutes = require("./routes/customerRoutes");
const archiveRoutes = require("./routes/archiveRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// 4. Create the Express application
const app = express();

// 5. Middleware (runs on every request before our routes)
app.use(cors()); // allow the React frontend to call this API
app.use(express.json()); // allow the server to read JSON sent in request bodies

// 6. Routes
// Health check: confirms the API (and the database connection) is running
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Restaurant Reservation API is running",
    database: getDatabaseStatus(),
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/archive", archiveRoutes);

// 7. Error handling (must come AFTER all routes)
app.use(notFound); // no route matched
app.use(errorHandler); // a route threw an error

// 8. Connect to MongoDB FIRST, then start the server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB(); // waits until the database is connected (or stops the server)

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
