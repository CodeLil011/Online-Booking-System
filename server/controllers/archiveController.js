// controllers/archiveController.js
// Archive module: move FINISHED records out of the main lists, view/search them, restore them.
//   Reservations: Completed/Cancelled only (Staff/Admin)
//   User accounts: deactivated accounts only (Admin only)
// Archiving does NOT delete anything: it only sets archived = true, so it can be undone.

const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const { toPublicUser } = require("../utils/authUtils");
const { escapeRegex } = require("../utils/validators");

// Only finished reservations can be archived (active ones still need work from staff)
const FINAL_STATUSES = ["Completed", "Cancelled"];

// ---------- Helper functions ----------

// Adds the NAME of the staff/admin who archived a record.
// (populate("archivedBy", "fullName") loaded that person's name.)
const withArchivedByName = (record, data) => ({
  ...data,
  archivedBy: record.archivedBy ? record.archivedBy._id : null,
  archivedByName: record.archivedBy ? record.archivedBy.fullName : null,
});

const toArchivedReservation = (r) => withArchivedByName(r, r.toJSON());
const toArchivedUser = (u) => withArchivedByName(u, toPublicUser(u));

// ========== RESERVATIONS ==========

// GET /api/archive/reservations
// Optional: ?search=carlo (name, email, phone, or reference number like #EA7886)
const getArchivedReservations = async (req, res) => {
  const { search } = req.query;

  const filter = { archived: true };
  if (search) {
    const text = search.trim();
    const contains = { $regex: escapeRegex(text), $options: "i" };
    filter.$or = [{ customerName: contains }, { customerEmail: contains }, { customerPhone: contains }];

    // A full reference number (the reservation's MongoDB id) also matches
    if (mongoose.isValidObjectId(text)) filter.$or.push({ _id: text });

    // A SHORT reference like "#EA7886" matches the LAST 6 characters of the id
    const shortRef = text.replace(/^#/, "");
    if (/^[0-9a-f]{6}$/i.test(shortRef)) {
      filter.$or.push({
        $expr: {
          $regexMatch: { input: { $toString: "$_id" }, regex: shortRef + "$", options: "i" },
        },
      });
    }

  }

  // Most recently archived first
  const records = await Reservation.find(filter)
    .sort({ archivedAt: -1 })
    .populate("table")
    .populate("archivedBy", "fullName");

  res.json({ success: true, count: records.length, data: records.map(toArchivedReservation) });
};

// PATCH /api/archive/reservations/:id/archive
// Moves a Completed or Cancelled reservation into the archive
const archiveReservation = async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  if (reservation.archived) {
    return res.status(400).json({ success: false, message: "This reservation is already archived" });
  }

  if (!FINAL_STATUSES.includes(reservation.status)) {
    return res.status(400).json({
      success: false,
      message: `Only Completed or Cancelled reservations can be archived (this one is ${reservation.status})`,
    });
  }

  reservation.archived = true;
  reservation.archivedAt = new Date();
  reservation.archivedBy = req.user._id; // who archived it
  await reservation.save();
  await reservation.populate([{ path: "table" }, { path: "archivedBy", select: "fullName" }]);

  res.json({
    success: true,
    message: "Reservation archived",
    data: toArchivedReservation(reservation),
  });
};

// PATCH /api/archive/reservations/:id/restore
// Brings an archived reservation back to the main list (its status does not change)
const restoreReservation = async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  if (!reservation.archived) {
    return res.status(400).json({ success: false, message: "This reservation is not archived" });
  }

  reservation.archived = false;
  reservation.archivedAt = null;
  reservation.archivedBy = null;
  await reservation.save();
  await reservation.populate("table");

  res.json({
    success: true,
    message: "Reservation restored",
    data: toArchivedReservation(reservation),
  });
};

// ========== USER ACCOUNTS (Admin only) ==========

// GET /api/archive/users
// Optional: ?search=paolo (name or email)
const getArchivedUsers = async (req, res) => {
  const { search } = req.query;

  const filter = { archived: true };
  if (search) {
    const contains = { $regex: escapeRegex(search.trim()), $options: "i" };
    filter.$or = [{ fullName: contains }, { email: contains }];
  }

  const records = await User.find(filter)
    .sort({ archivedAt: -1 })
    .populate("archivedBy", "fullName");

  res.json({ success: true, count: records.length, data: records.map(toArchivedUser) });
};

// PATCH /api/archive/users/:id/archive
// Moves a DEACTIVATED account into the archive
const archiveUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.archived) {
    return res.status(400).json({ success: false, message: "This account is already archived" });
  }

  // Must be deactivated first (so an archived account can never log in).
  // This also protects the admin's own account, which is always active.
  if (user.status !== "inactive") {
    return res.status(400).json({
      success: false,
      message: "Deactivate this account first. Only inactive accounts can be archived.",
    });
  }

  user.archived = true;
  user.archivedAt = new Date();
  user.archivedBy = req.user._id;
  await user.save();
  await user.populate("archivedBy", "fullName");

  res.json({ success: true, message: "Account archived", data: toArchivedUser(user) });
};

// PATCH /api/archive/users/:id/restore
// Brings the account back to Manage Users. It stays INACTIVE until the admin activates it.
const restoreUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!user.archived) {
    return res.status(400).json({ success: false, message: "This account is not archived" });
  }

  user.archived = false;
  user.archivedAt = null;
  user.archivedBy = null;
  await user.save();

  res.json({ success: true, message: "Account restored", data: toArchivedUser(user) });
};

module.exports = {
  getArchivedReservations,
  archiveReservation,
  restoreReservation,
  getArchivedUsers,
  archiveUser,
  restoreUser,
};
