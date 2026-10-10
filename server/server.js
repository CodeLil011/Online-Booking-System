// server.js
// Entry point of the backend. It creates the Express app,
// sets up middleware, connects route files, and starts the server.

// 1. Load environment variables from the .env file into process.env
require("dotenv").config();

// Stop immediately if the token secret is missing (login would not work)
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is missing in the .env file.");
  process.exit(1);
}

// 2. Import packages
const express = require("express");
const cors = require("cors");

// 3. Import our own route files and middleware
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
// Health check: confirms the API is running
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Restaurant Reservation API is running",
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

// 8. Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
