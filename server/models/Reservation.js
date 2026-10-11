// models/Reservation.js
// The shape of a reservation (booking) in MongoDB.

const mongoose = require("mongoose");
const { TIME_SLOTS, MIN_GUESTS, MAX_GUESTS, RESERVATION_STATUSES } = require("../config/businessRules");

const reservationSchema = new mongoose.Schema(
  {
    // The customer ACCOUNT that booked, or null for phone/walk-in bookings made by staff
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },

    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD" (text, same as before)
    time: { type: String, required: true, enum: TIME_SLOTS }, // "HH:MM"
    guests: { type: Number, required: true, min: MIN_GUESTS, max: MAX_GUESTS },
    specialRequest: { type: String, default: "", trim: true },

    status: { type: String, enum: RESERVATION_STATUSES, default: "Pending" },
    cancelledBy: { type: String, enum: ["customer", "staff", null], default: null },
    cancellationReason: { type: String, default: "" },

    // Archive (Step 25)
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);

// Makes the conflict check fast: finding bookings by table + date + time
reservationSchema.index({ table: 1, date: 1, time: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
