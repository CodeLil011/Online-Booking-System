// controllers/archiveController.js
// Archive module: move FINISHED records out of the main lists, view/search them, restore them.
//   Reservations: Completed/Cancelled only (Staff/Admin)
//   User accounts: deactivated accounts only (Admin only)
// Archiving does NOT delete anything: it only sets archived = true, so it can be undone.

const reservations = require("../data/reservations");
const tables = require("../data/tables");
const users = require("../data/users");
const { toPublicUser } = require("../utils/authUtils");

// Only finished reservations can be archived (active ones still need work from staff)
const FINAL_STATUSES = ["Completed", "Cancelled"];

// ---------- Helper functions ----------

// The NAME of the staff/admin who archived a record
const getArchivedByName = (record) => {
  const archivedByUser = users.find((u) => u._id === record.archivedBy);
  return archivedByUser ? archivedByUser.fullName : null;
};

// Adds table details and who archived it
const withArchiveDetails = (reservation) => ({
  ...reservation,
  table: tables.find((t) => t._id === reservation.table) || null,
  archivedByName: getArchivedByName(reservation),
});

// Removes the password hash and adds who archived it
const toArchivedUser = (user) => ({
  ...toPublicUser(user),
  archivedByName: getArchivedByName(user),
});

// ========== RESERVATIONS ==========

// GET /api/archive/reservations
// Optional: ?search=carlo (name, email, phone, or reference number)
const getArchivedReservations = (req, res) => {
  const { search } = req.query;

  let result = reservations.filter((r) => r.archived);
  if (search) {
    const text = search.trim().toLowerCase();
    result = result.filter(
      (r) =>
        r.customerName.toLowerCase().includes(text) ||
        r.customerEmail.includes(text) ||
        r.customerPhone.includes(text) ||
        r._id.toLowerCase() === text
    );
  }

  // Most recently archived first
  const sorted = [...result].sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));

  res.json({ success: true, count: sorted.length, data: sorted.map(withArchiveDetails) });
};

// PATCH /api/archive/reservations/:id/archive
// Moves a Completed or Cancelled reservation into the archive
const archiveReservation = (req, res) => {
  const reservation = reservations.find((r) => r._id === req.params.id);
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
  reservation.archivedAt = new Date().toISOString();
  reservation.archivedBy = req.user._id; // who archived it

  res.json({
    success: true,
    message: "Reservation archived",
    data: withArchiveDetails(reservation),
  });
};

// PATCH /api/archive/reservations/:id/restore
// Brings an archived reservation back to the main list (its status does not change)
const restoreReservation = (req, res) => {
  const reservation = reservations.find((r) => r._id === req.params.id);
  if (!reservation) {
    return res.status(404).json({ success: false, message: "Reservation not found" });
  }

  if (!reservation.archived) {
    return res.status(400).json({ success: false, message: "This reservation is not archived" });
  }

  reservation.archived = false;
  reservation.archivedAt = null;
  reservation.archivedBy = null;
  reservation.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: "Reservation restored",
    data: withArchiveDetails(reservation),
  });
};

// ========== USER ACCOUNTS (Admin only) ==========

// GET /api/archive/users
// Optional: ?search=paolo (name or email)
const getArchivedUsers = (req, res) => {
  const { search } = req.query;

  let result = users.filter((u) => u.archived);
  if (search) {
    const text = search.trim().toLowerCase();
    result = result.filter(
      (u) => u.fullName.toLowerCase().includes(text) || u.email.includes(text)
    );
  }

  const sorted = [...result].sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));

  res.json({ success: true, count: sorted.length, data: sorted.map(toArchivedUser) });
};

// PATCH /api/archive/users/:id/archive
// Moves a DEACTIVATED account into the archive
const archiveUser = (req, res) => {
  const user = users.find((u) => u._id === req.params.id);
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
  user.archivedAt = new Date().toISOString();
  user.archivedBy = req.user._id;

  res.json({ success: true, message: "Account archived", data: toArchivedUser(user) });
};

// PATCH /api/archive/users/:id/restore
// Brings the account back to Manage Users. It stays INACTIVE until the admin activates it.
const restoreUser = (req, res) => {
  const user = users.find((u) => u._id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!user.archived) {
    return res.status(400).json({ success: false, message: "This account is not archived" });
  }

  user.archived = false;
  user.archivedAt = null;
  user.archivedBy = null;
  user.updatedAt = new Date().toISOString();

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
