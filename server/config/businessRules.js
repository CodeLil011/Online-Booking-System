// config/businessRules.js
// The restaurant's booking rules, kept in ONE place
// so they are easy to find, explain, and change.

// Reservation seatings. Each seating lasts 2 hours,
// so reservations in different time slots never overlap.
const TIME_SLOTS = ["11:00", "13:00", "15:00", "17:00", "19:00"];

const MIN_GUESTS = 1;
const MAX_GUESTS = 10; // our largest table (Function Room) seats 10

// Customers can book from today up to this many days ahead
const BOOKING_WINDOW_DAYS = 30;

const RESERVATION_STATUSES = ["Pending", "Confirmed", "Cancelled", "Completed"];

// Reservations with these statuses still "hold" a table.
// Cancelled reservations release the table.
const ACTIVE_STATUSES = ["Pending", "Confirmed"];

// Which status changes are allowed (the reservation "workflow").
// Cancelled and Completed are final: they cannot change anymore.
const ALLOWED_STATUS_CHANGES = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Completed", "Cancelled"],
  Cancelled: [],
  Completed: [],
};

module.exports = {
  TIME_SLOTS,
  MIN_GUESTS,
  MAX_GUESTS,
  BOOKING_WINDOW_DAYS,
  RESERVATION_STATUSES,
  ACTIVE_STATUSES,
  ALLOWED_STATUS_CHANGES,
};
