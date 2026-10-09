// routes/authRoutes.js
// Connects URLs under /api/auth to controller functions.
// Routes with "protect" require a valid login token.

const express = require("express");
const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  checkResetToken,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public (no login needed)
router.post("/register", register); // POST /api/auth/register
router.post("/login", login); // POST /api/auth/login
router.post("/forgot-password", forgotPassword); // POST /api/auth/forgot-password
router.get("/reset-password/:token", checkResetToken); // GET /api/auth/reset-password/<token>
router.post("/reset-password", resetPassword); // POST /api/auth/reset-password

// Logged-in users only: their OWN account
router.get("/me", protect, getMe); // GET /api/auth/me
router.put("/me", protect, updateMe); // PUT /api/auth/me
router.put("/me/password", protect, changePassword); // PUT /api/auth/me/password

module.exports = router;
