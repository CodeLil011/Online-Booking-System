// routes/archiveRoutes.js
// Archive module: view, search, archive, and restore records.
//   Reservations -> Staff/Admin
//   User accounts -> Admin only

const express = require("express");
const {
  getArchivedReservations,
  archiveReservation,
  restoreReservation,
  getArchivedUsers,
  archiveUser,
  restoreUser,
} = require("../controllers/archiveController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Every route below needs a logged-in Admin or Staff
router.use(protect, allowRoles("admin", "staff"));

// Reservations (Staff/Admin)
router.get("/reservations", getArchivedReservations); // GET   /api/archive/reservations
router.patch("/reservations/:id/archive", archiveReservation); // PATCH /api/archive/reservations/r5/archive
router.patch("/reservations/:id/restore", restoreReservation); // PATCH /api/archive/reservations/r5/restore

// User accounts (Admin only: one more check on each route)
router.get("/users", allowRoles("admin"), getArchivedUsers); // GET   /api/archive/users
router.patch("/users/:id/archive", allowRoles("admin"), archiveUser); // PATCH /api/archive/users/u4/archive
router.patch("/users/:id/restore", allowRoles("admin"), restoreUser); // PATCH /api/archive/users/u4/restore

module.exports = router;
