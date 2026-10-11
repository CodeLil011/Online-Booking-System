// utils/authUtils.js
// Helper functions for authentication.

const jwt = require("jsonwebtoken");

// Creates a login token (JWT) for a user.
// The token contains the user's id and role, and is SIGNED with JWT_SECRET,
// so nobody can create or change a token without knowing the secret.
const generateToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });

// Returns the user WITHOUT private fields (password hash and password-reset data).
// The User model's toJSON() removes them (see models/User.js).
// Always use this before sending a user to the frontend.
const toPublicUser = (user) => user.toJSON();

module.exports = { generateToken, toPublicUser };
