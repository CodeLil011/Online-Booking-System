// middleware/errorMiddleware.js
// Two "catch-all" middleware functions placed AFTER all routes in server.js.

// 1. Runs when no route matched the URL -> 404 Not Found
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// 2. Runs when any route throws an error -> sends a clean JSON error
//    instead of crashing or sending an HTML error page.
//    Express recognizes an error handler because it has 4 parameters.
//    Express 5 also sends errors from async (await) code here automatically.
const errorHandler = (err, req, res, next) => {
  // MongoDB/Mongoose errors that are really the client's mistake:

  // An ID in the URL that isn't a valid MongoDB ID, e.g. /api/tables/abc
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid ID: ${err.value}` });
  }

  // A field broke a schema rule (required, enum, min/max...)
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // A "unique" field already exists (e.g. same email or table number)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "value";
    return res.status(409).json({ success: false, message: `That ${field} is already in use` });
  }

  // Anything else is a real server problem
  console.error(err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
  });
};

module.exports = { notFound, errorHandler };
