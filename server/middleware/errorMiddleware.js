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
const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
  });
};

module.exports = { notFound, errorHandler };
