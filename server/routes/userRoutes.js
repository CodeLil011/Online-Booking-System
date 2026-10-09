// routes/userRoutes.js
// Admin-only user management. EVERY route in this file requires an admin.

const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
} = require("../controllers/userController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// router.use() applies these guards to ALL routes below, so we don't repeat them
router.use(protect, allowRoles("admin"));

router.get("/", getAllUsers); // GET  /api/users
router.get("/:id", getUserById); // GET  /api/users/u3
router.post("/", createUser); // POST /api/users
router.put("/:id", updateUser); // PUT  /api/users/u3

module.exports = router;
