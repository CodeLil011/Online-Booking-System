// routes/customerRoutes.js
// Staff/Admin: view customers (read-only). Customers cannot see this list.

const express = require("express");
const { getCustomers, getCustomerById } = require("../controllers/customerController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Every route below needs a logged-in Admin or Staff
router.use(protect, allowRoles("admin", "staff"));

router.get("/", getCustomers); // GET /api/customers
router.get("/:id", getCustomerById); // GET /api/customers/u3

module.exports = router;
