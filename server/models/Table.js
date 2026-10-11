// models/Table.js
// The shape of a restaurant table in MongoDB.

const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true, unique: true, min: 1 },
    capacity: { type: Number, required: true, min: 1, max: 20 },
    location: { type: String, required: true, trim: true },
    // Set by staff: "available" = In Service, "unavailable" = Out of Service
    status: { type: String, enum: ["available", "unavailable"], default: "available" },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Table", tableSchema);
