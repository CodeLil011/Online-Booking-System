// controllers/authController.js
// Logic for /api/auth: registering customers, logging in (all roles),
// managing the logged-in user's own account, and password recovery.

const crypto = require("crypto"); // built into Node.js
const bcrypt = require("bcryptjs");
const users = require("../data/users");
const { generateToken, toPublicUser } = require("../utils/authUtils");
const { sendPasswordResetEmail } = require("../utils/emailService");

const SALT_ROUNDS = 10;
const RESET_TOKEN_MINUTES = 15; // how long a password reset link works

// Simple patterns for checking text input
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE_PATTERN = /^(09|\+639)\d{9}$/; // 09171234567 or +639171234567

// Password rule: at least 8 characters, with at least one letter and one number.
// Returns an error message, or null if OK.
const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return "password must be at least 8 characters";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "password must contain at least one letter and one number";
  }
  return null;
};

// Finds a user by email (not case-sensitive)
const findUserByEmail = (email) =>
  users.find((u) => u.email === email.trim().toLowerCase());

// Turns a reset token into a SHA-256 hash. Like passwords, we store only
// the hash, so a leaked user list cannot be used to reset passwords.
const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Finds the user whose saved reset-token hash matches AND hasn't expired
const findUserByResetToken = (token) => {
  const tokenHash = hashResetToken(token);
  return users.find((u) => u.resetTokenHash === tokenHash && u.resetTokenExpires > Date.now());
};

// POST /api/auth/register
// Creates a CUSTOMER account and logs them in right away (returns a token).
const register = async (req, res) => {
  const { fullName, email, phone, password } = req.body || {};

  // 1. Validate all input
  const errors = [];

  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    errors.push("fullName is required");
  }
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    errors.push("email must be a valid email address");
  }
  if (typeof phone !== "string" || !PH_MOBILE_PATTERN.test(phone)) {
    errors.push("phone must be a valid PH mobile number (e.g. 09171234567)");
  }
  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // 2. Email must not be used by another account
  if (findUserByEmail(email)) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists",
    });
  }

  // 3. Hash the password (NEVER store the plain password)
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 4. Create the user. Role is ALWAYS "customer" here, even if the
  //    request tries to send "role": "admin". Staff are created by the Admin.
  const newUser = {
    _id: `u${Date.now()}`, // temporary unique ID; MongoDB will generate _id later
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone,
    passwordHash,
    role: "customer",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // 5. Return a token so the customer is logged in immediately
  res.status(201).json({
    success: true,
    message: "Account created successfully",
    token: generateToken(newUser),
    user: toPublicUser(newUser),
  });
};

// POST /api/auth/login
// Checks email + password and returns a token. Works for all roles.
const login = async (req, res) => {
  const { email, password } = req.body || {};

  // 1. Both fields are required
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  // 2. Find the user and compare the password with the stored hash.
  //    Wrong email and wrong password give the SAME message, so attackers
  //    cannot find out which emails have accounts.
  const user = findUserByEmail(email);
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  // 3. Deactivated accounts cannot log in
  if (user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "This account has been deactivated. Please contact the restaurant.",
    });
  }

  // 4. Success: return a token and the user's public info
  res.json({
    success: true,
    message: "Login successful",
    token: generateToken(user),
    user: toPublicUser(user),
  });
};

// GET /api/auth/me   (logged in)
// "Who am I?" req.user was set by the protect middleware.
const getMe = (req, res) => {
  res.json({ success: true, user: toPublicUser(req.user) });
};

// PUT /api/auth/me   (logged in)
// Edit MY OWN name, email, or phone. Role and status can NOT be changed here.
const updateMe = (req, res) => {
  const { fullName, email, phone } = req.body || {};

  // 1. At least one field must be sent
  if (fullName === undefined && email === undefined && phone === undefined) {
    return res.status(400).json({ success: false, message: "No changes were provided" });
  }

  // 2. Validate only the fields that were sent
  const errors = [];

  if (fullName !== undefined && (typeof fullName !== "string" || fullName.trim().length < 2)) {
    errors.push("fullName must be at least 2 characters");
  }
  if (email !== undefined && (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim()))) {
    errors.push("email must be a valid email address");
  }
  if (phone !== undefined && (typeof phone !== "string" || !PH_MOBILE_PATTERN.test(phone))) {
    errors.push("phone must be a valid PH mobile number (e.g. 09171234567)");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // 3. A new email must not belong to ANOTHER account
  if (email !== undefined) {
    const owner = findUserByEmail(email);
    if (owner && owner._id !== req.user._id) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }
  }

  // 4. Apply the changes to the logged-in user
  if (fullName !== undefined) req.user.fullName = fullName.trim();
  if (email !== undefined) req.user.email = email.trim().toLowerCase();
  if (phone !== undefined) req.user.phone = phone;
  req.user.updatedAt = new Date().toISOString();

  res.json({ success: true, message: "Profile updated", user: toPublicUser(req.user) });
};

// PUT /api/auth/me/password   (logged in)
// Change MY password. The current password is required, so someone using
// an unlocked computer cannot change it.
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  // 1. Current password is required and must be correct
  if (typeof currentPassword !== "string" || !currentPassword) {
    return res.status(400).json({ success: false, message: "currentPassword is required" });
  }

  const matches = await bcrypt.compare(currentPassword, req.user.passwordHash);
  if (!matches) {
    return res.status(400).json({ success: false, message: "Current password is incorrect" });
  }

  // 2. The new password must follow the password rule and be different
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }
  if (newPassword === currentPassword) {
    return res.status(400).json({
      success: false,
      message: "New password must be different from the current password",
    });
  }

  // 3. Save the HASH of the new password
  req.user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  req.user.updatedAt = new Date().toISOString();

  res.json({ success: true, message: "Password changed successfully" });
};

// POST /api/auth/forgot-password   (public)
// Body: { "email": "..." }
// Creates a one-time reset link and "emails" it to the user.
const forgotPassword = async (req, res) => {
  const { email } = req.body || {};

  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
  }

  const user = findUserByEmail(email);

  // Only active accounts get a reset link
  if (user && user.status === "active") {
    // 1. Create a long random secret (64 characters) for the link
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Save only its HASH and an expiry time on the user
    user.resetTokenHash = hashResetToken(resetToken);
    user.resetTokenExpires = Date.now() + RESET_TOKEN_MINUTES * 60 * 1000;

    // 3. Build the link to the website's reset page and "send" it
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(user, resetLink, RESET_TOKEN_MINUTES);
  }

  // SAME answer whether the email exists or not,
  // so attackers cannot find out which emails have accounts
  res.json({
    success: true,
    message: "If an account with that email exists, a password reset link has been sent.",
  });
};

// GET /api/auth/reset-password/:token   (public)
// Lets the reset page check the link BEFORE showing the form.
const checkResetToken = (req, res) => {
  const user = findUserByResetToken(req.params.token);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "This reset link is invalid or has expired. Please request a new one.",
    });
  }

  res.json({ success: true, message: "Reset link is valid" });
};

// POST /api/auth/reset-password   (public)
// Body: { "token": "...from the link...", "newPassword": "..." }
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (typeof token !== "string" || !token) {
    return res.status(400).json({ success: false, message: "Reset token is missing" });
  }

  // 1. Find the user whose saved hash matches this token AND hasn't expired
  const user = findUserByResetToken(token);

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "This reset link is invalid or has expired. Please request a new one.",
    });
  }

  // 2. The new password must follow the password rule
  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }

  // 3. Save the new password HASH and delete the reset token (one-time use)
  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  delete user.resetTokenHash;
  delete user.resetTokenExpires;
  user.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: "Your password has been reset. You can now log in with your new password.",
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  checkResetToken,
  resetPassword,
};
