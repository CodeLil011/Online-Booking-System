// routes/tableRoutes.js
// Connects URLs under /api/tables to controller functions.
// The "/api/tables" prefix is added in server.js, so "/" here means "/api/tables".

const express = require("express");
const {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
} = require("../controllers/tableController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Public: anyone can view tables
router.get("/", getAllTables); // GET  /api/tables
router.get("/:id", getTableById); // GET  /api/tables/t5

// Staff/Admin only: add and edit tables
router.post("/", protect, allowRoles("admin", "staff"), createTable); // POST /api/tables
router.put("/:id", protect, allowRoles("admin", "staff"), updateTable); // PUT  /api/tables/t5

module.exports = router;
