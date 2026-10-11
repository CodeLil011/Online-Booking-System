// controllers/customerController.js
// Staff/Admin: VIEW customer accounts and their booking history (read-only).
// Separate from /api/users because that one is Admin-only and can EDIT accounts.

const User = require("../models/User");
const Reservation = require("../models/Reservation");
const { ACTIVE_STATUSES } = require("../config/businessRules");
const { getToday } = require("../utils/dateUtils");
const { toPublicUser } = require("../utils/authUtils");
const { escapeRegex } = require("../utils/validators");

const STATUSES = ["active", "inactive"];

// ---------- Helper functions ----------

// Booking numbers for ONE customer, from their list of reservations:
// total, completed, cancelled, upcoming, last visit
const getBookingSummary = (list) => {
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
const getCustomers = async (req, res) => {
  const { search, status } = req.query;

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${STATUSES.join(", ")}`,
    });
  }

  // Customer accounts only (archived accounts are hidden)
  const filter = { role: "customer", archived: { $ne: true } };
  if (status) filter.status = status;
  if (search) {
    const text = escapeRegex(search.trim());
    filter.$or = [
      { fullName: { $regex: text, $options: "i" } },
      { email: { $regex: text, $options: "i" } },
      { phone: { $regex: text } },
    ];
  }

  const customers = await User.find(filter).sort({ fullName: 1 });

  // ONE query for the reservations of ALL these customers (faster than one query each)
  const reservations = await Reservation.find({
    customer: { $in: customers.map((c) => c._id) },
  });

  const data = customers.map((c) => ({
    ...toPublicUser(c),
    bookings: getBookingSummary(reservations.filter((r) => r.customer.equals(c._id))),
  }));

  res.json({ success: true, count: data.length, data });
};

// GET /api/customers/:id
// One customer + their full booking history (newest first)
const getCustomerById = async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: "customer" });

  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }

  const history = await Reservation.find({ customer: customer._id })
    .sort({ date: -1, time: -1 })
    .populate("table");

  res.json({
    success: true,
    data: {
      ...toPublicUser(customer),
      bookings: getBookingSummary(history),
      reservations: history,
    },
  });
};

module.exports = { getCustomers, getCustomerById };
