// routes/reservationRoutes.js
// Connects URLs under /api/reservations to controller functions.
// protect = must be logged in; allowRoles(...) = only these roles.
// Fixed paths (/availability, /slots, /my) must come BEFORE "/:id".

const express = require("express");
const {
  getAllReservations,
  getMyReservations,
  getAvailableTables,
  getSlotAvailability,
  getReservationById,
  createReservation,
  updateReservation,
  updateReservationStatus,
  cancelReservation,
} = require("../controllers/reservationController");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Public: anyone can check availability
router.get("/availability", getAvailableTables); // free tables for one slot
router.get("/slots", getSlotAvailability); // which slots of a day still have a table

// Customer: my own reservations
router.get("/my", protect, allowRoles("customer"), getMyReservations);

// Staff/Admin: all reservations
router.get("/", protect, allowRoles("admin", "staff"), getAllReservations);

// Logged in: one reservation (customers only their own; checked in the controller)
router.get("/:id", protect, getReservationById);

// Logged in: make a booking (customers get a table automatically)
router.post("/", protect, createReservation);

// Staff/Admin: edit details and change status
router.put("/:id", protect, allowRoles("admin", "staff"), updateReservation);
router.patch("/:id/status", protect, allowRoles("admin", "staff"), updateReservationStatus);

// Customer: cancel their OWN reservation (checked in the controller)
router.patch("/:id/cancel", protect, allowRoles("customer"), cancelReservation);

module.exports = router;
