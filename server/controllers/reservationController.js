// controllers/reservationController.js
// Logic for the /api/reservations endpoints:
// availability, booking (with automatic table assignment), viewing,
// editing, and changing reservation status.
// Reservations and tables are now saved in MongoDB.

const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");
const {
  TIME_SLOTS,
  MIN_GUESTS,
  MAX_GUESTS,
  BOOKING_WINDOW_DAYS,
  RESERVATION_STATUSES,
  ACTIVE_STATUSES,
  ALLOWED_STATUS_CHANGES,
} = require("../config/businessRules");
const {
  getToday,
  addDays,
  getCurrentTime,
  isValidDateString,
} = require("../utils/dateUtils");
const { EMAIL_PATTERN, PH_MOBILE_PATTERN } = require("../utils/validators");

// Fields that staff are allowed to change when editing a reservation
const EDITABLE_FIELDS = [
  "customerName",
  "customerEmail",
  "customerPhone",
  "table",
  "date",
  "time",
  "guests",
  "specialRequest",
];

// ---------- Helper functions ----------

// Checks a booking DATE. Returns an error message, or null if OK.
const validateDate = (date) => {
  if (!isValidDateString(date)) {
    return "date must be a valid date in YYYY-MM-DD format";
  }

  const today = getToday();
  if (date < today) {
    return "date cannot be in the past";
  }
  if (date > addDays(today, BOOKING_WINDOW_DAYS)) {
    return `reservations can only be made up to ${BOOKING_WINDOW_DAYS} days ahead`;
  }

  return null;
};

// true if the slot is TODAY and its start time has already passed
const hasSlotPassed = (date, time) => date === getToday() && time <= getCurrentTime();

// Checks a booking date + time. Returns an error message, or null if OK.
const validateSchedule = (date, time) => {
  const dateError = validateDate(date);
  if (dateError) return dateError;

  if (!TIME_SLOTS.includes(time)) {
    return `time must be one of: ${TIME_SLOTS.join(", ")}`;
  }
  if (hasSlotPassed(date, time)) {
    return "this time slot has already passed today";
  }

  return null;
};

// true if guests is a whole number within the allowed range
const isValidGuests = (guests) =>
  Number.isInteger(guests) && guests >= MIN_GUESTS && guests <= MAX_GUESTS;

// Checks all reservation fields. Used by BOTH create and edit.
// "table" is optional (customers' tables are assigned automatically).
// Returns a list of error messages (empty list = everything is valid).
const validateReservationData = (data) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    table,
    date,
    time,
    guests,
    specialRequest,
  } = data;

  const errors = [];

  if (typeof customerName !== "string" || customerName.trim().length < 2) {
    errors.push("customerName is required");
  }
  if (typeof customerEmail !== "string" || !EMAIL_PATTERN.test(customerEmail.trim())) {
    errors.push("customerEmail must be a valid email address");
  }
  if (typeof customerPhone !== "string" || !PH_MOBILE_PATTERN.test(customerPhone)) {
    errors.push("customerPhone must be a valid PH mobile number (e.g. 09171234567)");
  }

  const scheduleError = validateSchedule(date, time);
  if (scheduleError) errors.push(scheduleError);

  if (!isValidGuests(guests)) {
    errors.push(`guests must be a whole number from ${MIN_GUESTS} to ${MAX_GUESTS}`);
  }
  if (table !== undefined && table !== null && table !== "" && !mongoose.isValidObjectId(table)) {
    errors.push("table must be a valid table id");
  }
  if (
    specialRequest !== undefined &&
    (typeof specialRequest !== "string" || specialRequest.length > 300)
  ) {
    errors.push("specialRequest must be text with at most 300 characters");
  }

  return errors;
};

// The MongoDB filter for "ACTIVE (Pending/Confirmed) bookings in this date + time slot".
// excludeId: a reservation to ignore (used when EDITING, so it doesn't conflict with itself).
const activeBookingsFilter = (date, time, excludeId = null) => {
  const filter = { date, time, status: { $in: ACTIVE_STATUSES } }; // $in = "is one of"
  if (excludeId) filter._id = { $ne: excludeId };
  return filter;
};

// THE CONFLICT CHECK:
// true if the table already has an ACTIVE reservation on the same date and time slot.
const isTableBooked = async (tableId, date, time, excludeId = null) =>
  Boolean(await Reservation.exists({ ...activeBookingsFilter(date, time, excludeId), table: tableId }));

// All tables that can take this party at this date + time, SMALLEST FIRST.
// Used by: the availability list, the slot buttons, and automatic table assignment.
const findAvailableTables = async (date, time, guests, excludeId = null) => {
  // 1. The ids of tables already booked in this slot
  const bookedTableIds = await Reservation.distinct(
    "table",
    activeBookingsFilter(date, time, excludeId)
  );

  // 2. In-service tables that are big enough and NOT in that list ($nin = "not in")
  return Table.find({
    status: "available",
    capacity: { $gte: guests },
    _id: { $nin: bookedTableIds },
  }).sort({ capacity: 1, tableNumber: 1 });
};

// true if the reservation's date + time has already arrived.
const hasStarted = (reservation) =>
  `${reservation.date} ${reservation.time}` <= `${getToday()} ${getCurrentTime()}`;

// Checks an optional cancellation reason. Returns an error message, or null if OK.
const validateReason = (reason) => {
  if (reason !== undefined && (typeof reason !== "string" || reason.length > 200)) {
    return "reason must be text with at most 200 characters";
  }
  return null;
};

// ---------- Controller functions ----------

// GET /api/reservations   (Staff/Admin)
// Optional filters: ?date=2026-10-10  ?status=Pending  ?table=<table id>
const getAllReservations = async (req, res) => {
  const { date, status, table } = req.query;

  if (status && !RESERVATION_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${RESERVATION_STATUSES.join(", ")}`,
    });
  }

  // Archived reservations are hidden here (they appear on the Archive page instead)
  const filter = { archived: { $ne: true } };
  if (date) filter.date = date;
  if (status) filter.status = status;
  if (table) filter.table = table;

  // populate("table") replaces the table id with the full table (number, capacity, location)
  const reservations = await Reservation.find(filter)
    .sort({ date: 1, time: 1 })
    .populate("table");

  res.json({ success: true, count: reservations.length, data: reservations });
};

// GET /api/reservations/my   (Customer)
// The logged-in customer's OWN reservations, newest date first.
const getMyReservations = async (req, res) => {
  const mine = await Reservation.find({ customer: req.user._id })
    .sort({ date: -1, time: -1 })
    .populate("table");

  res.json({ success: true, count: mine.length, data: mine });
};

// GET /api/reservations/availability?date=2026-10-10&time=19:00&guests=4   (public)
// The tables that can be booked for that schedule and party size.
const getAvailableTables = async (req, res) => {
  const { date, time, exclude } = req.query;
  const guests = Number(req.query.guests); // URL values are text, so convert

  const scheduleError = validateSchedule(date, time);
  if (scheduleError) {
    return res.status(400).json({ success: false, message: scheduleError });
  }
  if (!isValidGuests(guests)) {
    return res.status(400).json({
      success: false,
      message: `guests must be a whole number from ${MIN_GUESTS} to ${MAX_GUESTS}`,
    });
  }

  const availableTables = await findAvailableTables(date, time, guests, exclude || null);

  res.json({
    success: true,
    date,
    time,
    guests,
    exclude,
    count: availableTables.length,
    data: availableTables,
  });
};

// GET /api/reservations/slots?date=2026-10-10&guests=4   (public)
// For EACH time slot of that day: can this party still be seated?
// Used for the time slot buttons on the booking form.
const getSlotAvailability = async (req, res) => {
  const { date } = req.query;
  const guests = Number(req.query.guests);

  const dateError = validateDate(date);
  if (dateError) {
    return res.status(400).json({ success: false, message: dateError });
  }
  if (!isValidGuests(guests)) {
    return res.status(400).json({
      success: false,
      message: `guests must be a whole number from ${MIN_GUESTS} to ${MAX_GUESTS}`,
    });
  }

  // Check all 5 slots at the same time (Promise.all waits for all of them)
  const slots = await Promise.all(
    TIME_SLOTS.map(async (time) => {
      if (hasSlotPassed(date, time)) {
        return { time, available: false, tablesLeft: 0, reason: "Time has passed" };
      }

      const tablesLeft = (await findAvailableTables(date, time, guests)).length;
      return {
        time,
        available: tablesLeft > 0,
        tablesLeft,
        reason: tablesLeft > 0 ? "" : "Fully booked",
      };
    })
  );

  res.json({ success: true, date, guests, data: slots });
};

// GET /api/reservations/:id   (logged in)
// Staff/Admin can view any reservation; customers only their OWN.
const getReservationById = async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate("table");

  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  const isOwner = reservation.customer && reservation.customer.equals(req.user._id);
  if (req.user.role === "customer" && !isOwner) {
    return res.status(403).json({
      success: false,
      message: "You can only view your own reservations",
    });
  }

  res.json({ success: true, data: reservation });
};

// POST /api/reservations   (logged in)
// Creates a reservation. The table is assigned AUTOMATICALLY for customers.
// Staff/Admin may choose a table (e.g. phone bookings) or let it auto-assign.
const createReservation = async (req, res) => {
  const data = req.body || {};

  // 1. Validate all input and collect every error at once
  const errors = validateReservationData(data);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  const { customerName, customerEmail, customerPhone, date, time, guests, specialRequest } =
    data;
  const isCustomer = req.user.role === "customer";

  // 2. Customers cannot choose a table (any "table" they send is ignored)
  const requestedTableId = isCustomer ? undefined : data.table;

  // 3. A customer cannot hold two active bookings in the same time slot
  if (isCustomer) {
    const alreadyBooked = await Reservation.exists({
      ...activeBookingsFilter(date, time),
      customer: req.user._id,
    });
    if (alreadyBooked) {
      return res.status(409).json({
        success: false,
        message: `You already have a reservation on ${date} at ${time}`,
      });
    }
  }

  // 4. Decide the table
  let table;

  if (requestedTableId) {
    // Staff chose a specific table: check it like before
    table = await Table.findById(requestedTableId);

    if (!table) {
      return res.status(404).json({ success: false, message: "Selected table not found" });
    }
    if (table.status !== "available") {
      return res.status(400).json({
        success: false,
        message: `Table ${table.tableNumber} is currently not available for booking`,
      });
    }
    if (table.capacity < guests) {
      return res.status(400).json({
        success: false,
        message: `Table ${table.tableNumber} seats only ${table.capacity} guests`,
      });
    }
    if (await isTableBooked(table._id, date, time)) {
      return res.status(409).json({
        success: false,
        message: `Table ${table.tableNumber} is already reserved on ${date} at ${time}`,
      });
    }
  } else {
    // AUTO-ASSIGN: the smallest free table that fits the party
    table = (await findAvailableTables(date, time, guests))[0];

    if (!table) {
      return res.status(409).json({
        success: false,
        message: `Sorry, no tables are available for ${guests} guest(s) on ${date} at ${time}. Please choose another time.`,
      });
    }
  }

  // 5. Save the reservation. Status is ALWAYS "Pending": staff must confirm it.
  const newReservation = await Reservation.create({
    customer: isCustomer ? req.user._id : null, // which account booked it
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone,
    table: table._id,
    date,
    time,
    guests,
    specialRequest: specialRequest ? specialRequest.trim() : "",
    status: "Pending",
  });

  await newReservation.populate("table"); // include the table details in the answer

  res.status(201).json({
    success: true,
    message: "Reservation submitted and waiting for confirmation",
    data: newReservation,
  });
};

// PUT /api/reservations/:id   (Staff/Admin)
// Edits reservation details. Only the fields that were sent are changed.
const updateReservation = async (req, res) => {
  // 1. Find the reservation
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  // 2. Only active reservations that have not started can be edited
  if (!ACTIVE_STATUSES.includes(reservation.status)) {
    return res.status(400).json({
      success: false,
      message: `Only Pending or Confirmed reservations can be edited (this one is ${reservation.status})`,
    });
  }
  if (hasStarted(reservation)) {
    return res.status(400).json({
      success: false,
      message: "This reservation can no longer be edited because its schedule has started",
    });
  }

  const data = req.body || {};

  // 3. Status changes must go through PATCH /:id/status (workflow rules)
  if (data.status !== undefined) {
    return res.status(400).json({
      success: false,
      message: "Status cannot be changed here. Use PATCH /api/reservations/:id/status",
    });
  }

  // 4. Keep only the editable fields that were actually sent
  const changes = {};
  EDITABLE_FIELDS.forEach((field) => {
    if (data[field] !== undefined) changes[field] = data[field];
  });

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ success: false, message: "No changes were provided" });
  }

  // 5. MERGE: current data + changes = what the reservation would look like
  //    (toObject() turns the MongoDB document into a plain object; the table id becomes text)
  const updated = { ...reservation.toObject(), table: reservation.table.toString(), ...changes };

  // 6. Validate the merged result with the SAME rules as a new booking
  const errors = validateReservationData(updated);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // 7. Check the table (it may be the same table or a new one)
  const table = await Table.findById(updated.table);

  if (!table) {
    return res.status(404).json({ success: false, message: "Selected table not found" });
  }
  if (table.status !== "available") {
    return res.status(400).json({
      success: false,
      message: `Table ${table.tableNumber} is currently not available for booking`,
    });
  }
  if (table.capacity < updated.guests) {
    return res.status(400).json({
      success: false,
      message: `Table ${table.tableNumber} seats only ${table.capacity} guests`,
    });
  }

  // 8. Conflict check, IGNORING this reservation itself
  if (await isTableBooked(table._id, updated.date, updated.time, reservation._id)) {
    return res.status(409).json({
      success: false,
      message: `Table ${table.tableNumber} is already reserved on ${updated.date} at ${updated.time}`,
    });
  }

  // 9. Everything is valid: save the changes to MongoDB
  reservation.customerName = updated.customerName.trim();
  reservation.customerEmail = updated.customerEmail.trim().toLowerCase();
  reservation.customerPhone = updated.customerPhone;
  reservation.table = table._id;
  reservation.date = updated.date;
  reservation.time = updated.time;
  reservation.guests = updated.guests;
  reservation.specialRequest = updated.specialRequest ? updated.specialRequest.trim() : "";
  await reservation.save();
  await reservation.populate("table");

  res.json({ success: true, message: "Reservation updated", data: reservation });
};

// PATCH /api/reservations/:id/status   (Staff/Admin)
// Body: { "status": "Confirmed" | "Cancelled" | "Completed", "reason": "optional" }
const updateReservationStatus = async (req, res) => {
  // 1. Find the reservation
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  const { status, reason } = req.body || {};

  // 2. Check that the new status and reason are valid
  if (!RESERVATION_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${RESERVATION_STATUSES.join(", ")}`,
    });
  }

  const reasonError = validateReason(reason);
  if (reasonError) {
    return res.status(400).json({ success: false, message: reasonError });
  }

  // 3. Check the workflow: is this status change allowed?
  const allowedNextStatuses = ALLOWED_STATUS_CHANGES[reservation.status];
  if (!allowedNextStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot change a ${reservation.status} reservation to ${status}`,
    });
  }

  // 4. Time rules
  if (status === "Confirmed" && hasStarted(reservation)) {
    return res.status(400).json({
      success: false,
      message: "Cannot confirm a reservation whose schedule has already passed",
    });
  }
  if (status === "Completed" && !hasStarted(reservation)) {
    return res.status(400).json({
      success: false,
      message: "Cannot complete a reservation before its scheduled time",
    });
  }

  // 5. Apply the change and save
  reservation.status = status;

  if (status === "Cancelled") {
    reservation.cancelledBy = "staff";
    reservation.cancellationReason = reason ? reason.trim() : "";
  }

  await reservation.save();
  await reservation.populate("table");

  res.json({
    success: true,
    message: `Reservation marked as ${status}`,
    data: reservation,
  });
};

// PATCH /api/reservations/:id/cancel   (Customer)
// Body: { "reason": "optional" }
// Customers can only cancel their OWN Pending/Confirmed bookings that have not started.
const cancelReservation = async (req, res) => {
  // 1. Find the reservation
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  // 2. It must belong to the logged-in customer
  if (!reservation.customer || !reservation.customer.equals(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: "You can only cancel your own reservations",
    });
  }

  // 3. Only active reservations can be cancelled
  if (!ACTIVE_STATUSES.includes(reservation.status)) {
    return res.status(400).json({
      success: false,
      message: `Only Pending or Confirmed reservations can be cancelled (this one is ${reservation.status})`,
    });
  }

  // 4. Cannot cancel once the schedule has started
  if (hasStarted(reservation)) {
    return res.status(400).json({
      success: false,
      message: "This reservation can no longer be cancelled because its schedule has started",
    });
  }

  const { reason } = req.body || {};
  const reasonError = validateReason(reason);
  if (reasonError) {
    return res.status(400).json({ success: false, message: reasonError });
  }

  // 5. Cancel it. The table is automatically free again, because the
  //    conflict check only counts Pending/Confirmed reservations.
  reservation.status = "Cancelled";
  reservation.cancelledBy = "customer";
  reservation.cancellationReason = reason ? reason.trim() : "";
  await reservation.save();
  await reservation.populate("table");

  res.json({ success: true, message: "Reservation cancelled", data: reservation });
};

module.exports = {
  getAllReservations,
  getMyReservations,
  getAvailableTables,
  getSlotAvailability,
  getReservationById,
  createReservation,
  updateReservation,
  updateReservationStatus,
  cancelReservation,
};
