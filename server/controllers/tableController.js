// controllers/tableController.js
// Logic for the /api/tables endpoints (now saved in MongoDB).
// Each function receives the request (req) and sends back a response (res).

const Table = require("../models/Table");

const ALLOWED_STATUSES = ["available", "unavailable"];

// Helper: checks table data and returns a list of error messages.
// isUpdate = true -> fields are optional (only check fields that were sent)
// isUpdate = false -> tableNumber, capacity, and location are required
const validateTable = (data, isUpdate = false) => {
  const errors = [];
  const { tableNumber, capacity, location, status } = data;

  if (!isUpdate || tableNumber !== undefined) {
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      errors.push("tableNumber must be a whole number greater than 0");
    }
  }

  if (!isUpdate || capacity !== undefined) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
      errors.push("capacity must be a whole number from 1 to 20");
    }
  }

  if (!isUpdate || location !== undefined) {
    if (typeof location !== "string" || location.trim() === "") {
      errors.push("location is required");
    }
  }

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
  }

  return errors;
};

// GET /api/tables
// Returns all tables (sorted by table number). Optional filters in the URL:
//   ?status=available     -> only tables with that status
//   ?minCapacity=4        -> only tables that seat at least 4 people
const getAllTables = async (req, res) => {
  const { status, minCapacity } = req.query;
  const filter = {}; // MongoDB filter: {} = everything

  if (status) {
    filter.status = status;
  }

  if (minCapacity) {
    const min = Number(minCapacity);

    // Reject values like ?minCapacity=abc
    if (Number.isNaN(min) || min < 1) {
      return res.status(400).json({
        success: false,
        message: "minCapacity must be a positive number",
      });
    }

    filter.capacity = { $gte: min }; // $gte = "greater than or equal"
  }

  const tables = await Table.find(filter).sort({ tableNumber: 1 });

  res.json({ success: true, count: tables.length, data: tables });
};

// GET /api/tables/:id
// Returns one table by its _id, or 404 if it does not exist.
const getTableById = async (req, res) => {
  const table = await Table.findById(req.params.id);

  if (!table) {
    return res.status(404).json({ success: false, message: "Table not found" });
  }

  res.json({ success: true, data: table });
};

// POST /api/tables
// Creates a new table after validating the data.
const createTable = async (req, res) => {
  const data = req.body || {}; // req.body is undefined if no JSON was sent

  // 1. Validate the input
  const errors = validateTable(data);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // 2. Table numbers must be unique
  const duplicate = await Table.exists({ tableNumber: data.tableNumber });
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: `Table ${data.tableNumber} already exists`,
    });
  }

  // 3. Save the new table using ONLY the allowed fields
  //    (extra fields sent by the client are ignored). MongoDB creates the _id.
  const newTable = await Table.create({
    tableNumber: data.tableNumber,
    capacity: data.capacity,
    location: data.location.trim(),
    status: data.status || "available",
  });

  // 4. Return it with status 201 (Created)
  res.status(201).json({ success: true, message: "Table created", data: newTable });
};

// PUT /api/tables/:id
// Updates only the fields that were sent (e.g. just the status).
const updateTable = async (req, res) => {
  // 1. Find the table
  const table = await Table.findById(req.params.id);
  if (!table) {
    return res.status(404).json({ success: false, message: "Table not found" });
  }

  const data = req.body || {};

  // 2. Validate only the fields that were sent
  const errors = validateTable(data, true);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // 3. If the table number is changing, it must not belong to ANOTHER table
  if (data.tableNumber !== undefined) {
    const duplicate = await Table.exists({
      tableNumber: data.tableNumber,
      _id: { $ne: table._id }, // $ne = "not equal": ignore this table itself
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Table ${data.tableNumber} already exists`,
      });
    }
  }

  // 4. Apply the changes (only fields that were sent) and save to MongoDB
  if (data.tableNumber !== undefined) table.tableNumber = data.tableNumber;
  if (data.capacity !== undefined) table.capacity = data.capacity;
  if (data.location !== undefined) table.location = data.location.trim();
  if (data.status !== undefined) table.status = data.status;
  await table.save();

  res.json({ success: true, message: "Table updated", data: table });
};

module.exports = { getAllTables, getTableById, createTable, updateTable };
