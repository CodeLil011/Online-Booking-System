// controllers/customerController.js
// Staff/Admin: VIEW customer accounts and their booking history (read-only).
// Separate from /api/users because that one is Admin-only and can EDIT accounts.

const users = require("../data/users");
const reservations = require("../data/reservations");
const tables = require("../data/tables");
const { ACTIVE_STATUSES } = require("../config/businessRules");
const { getToday } = require("../utils/dateUtils");
const { toPublicUser } = require("../utils/authUtils");

const STATUSES = ["active", "inactive"];

// ---------- Helper functions ----------

// All reservations made by one customer ACCOUNT (walk-in/phone bookings have customer: null)
const getCustomerReservations = (customerId) =>
  reservations.filter((r) => r.customer === customerId);

// Booking numbers for one customer: total, completed, cancelled, upcoming, last visit
const getBookingSummary = (customerId) => {
  const list = getCustomerReservations(customerId);
  const today = getToday();

  // Last visit = the latest date among their COMPLETED reservations
  const completedDates = list
    .filter((r) => r.status === "Completed")
    .map((r) => r.date)
    .sort();

  return {
    total: list.length,
    completed: completedDates.length,
    cancelled: list.filter((r) => r.status === "Cancelled").length,
    upcoming: list.filter((r) => ACTIVE_STATUSES.includes(r.status) && r.date >= today).length,
    lastVisit: completedDates.length > 0 ? completedDates[completedDates.length - 1] : null,
  };
};

// ---------- Controller functions ----------

// GET /api/customers
// Optional filters: ?search=maria (name, email, or phone)  ?status=active
const getCustomers = (req, res) => {
  const { search, status } = req.query;

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${STATUSES.join(", ")}`,
    });
  }

  // Customer accounts only (archived accounts are hidden)
  let result = users.filter((u) => u.role === "customer" && !u.archived);
  if (status) result = result.filter((u) => u.status === status);
  if (search) {
    const text = search.trim().toLowerCase();
    result = result.filter(
      (u) =>
        u.fullName.toLowerCase().includes(text) ||
        u.email.includes(text) ||
        u.phone.includes(text)
    );
  }

  const data = [...result]
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((u) => ({ ...toPublicUser(u), bookings: getBookingSummary(u._id) }));

  res.json({ success: true, count: data.length, data });
};

// GET /api/customers/:id
// One customer + their full booking history (newest first)
const getCustomerById = (req, res) => {
  const customer = users.find((u) => u._id === req.params.id && u.role === "customer");

  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }

  const history = getCustomerReservations(customer._id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
    .map((r) => ({ ...r, table: tables.find((t) => t._id === r.table) || null }));

  res.json({
    success: true,
    data: {
      ...toPublicUser(customer),
      bookings: getBookingSummary(customer._id),
      reservations: history,
    },
  });
};

module.exports = { getCustomers, getCustomerById };
