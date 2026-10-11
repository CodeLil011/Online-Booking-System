// middleware/authMiddleware.js
// The two "guards" that run BEFORE a controller:
//   protect     -> is the user logged in? (valid token)
//   allowRoles  -> does the user have the right role?

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

// GUARD 1: "Who are you? Show a valid token."
const protect = async (req, res, next) => {
  // 1. Read the token from the header: "Authorization: Bearer eyJhbGci..."
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Please log in first" });
  }

  const token = header.slice(7); // remove the word "Bearer " (7 characters)

  // 2. Check the signature and expiry date. jwt.verify throws an error
  //    if the token was changed, faked, or has expired.
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session is invalid or has expired. Please log in again.",
    });
  }

  // 3. The account must still exist and be active
  //    (e.g. the Admin may have deactivated it after the token was given).
  //    Old tokens from before MongoDB have ids like "u3", which are not valid MongoDB ids.
  const user = mongoose.isValidObjectId(payload.id) ? await User.findById(payload.id) : null;

  if (!user || user.status !== "active") {
    return res.status(401).json({
      success: false,
      message: "Account not found or deactivated. Please log in again.",
    });
  }

  // 4. Remember who is making this request, then let the request continue
  req.user = user;
  next();
};

// GUARD 2: "Is your role allowed here?"
// Usage in routes: allowRoles("admin", "staff")
// Must be used AFTER protect (it needs req.user).
const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to do this",
    });
  }
  next();
};

module.exports = { protect, allowRoles };
