// data/users.js
// TEMPORARY in-memory users (replaced by MongoDB in Phase 9).
//
// Passwords are NEVER stored as plain text. bcrypt.hashSync() turns each
// development password into a hash when this file loads.
// The full set of 10 demo users is created in Phase 11.
//
// Development login passwords (for testing only):
//   Admin:    Admin@123
//   Staff:    Staff@123
//   Customer: Customer@123

const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10; // how much work bcrypt does; higher = slower to crack

const users = [
  {
    _id: "u1",
    fullName: "Andrea Villanueva",
    email: "andrea.villanueva@gmail.com",
    phone: "09171112222",
    passwordHash: bcrypt.hashSync("Admin@123", SALT_ROUNDS),
    role: "admin",
    status: "active",
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    _id: "u2",
    fullName: "Marco Delos Reyes",
    email: "marco.delosreyes@gmail.com",
    phone: "09182223333",
    passwordHash: bcrypt.hashSync("Staff@123", SALT_ROUNDS),
    role: "staff",
    status: "active",
    createdAt: "2026-09-02T08:00:00.000Z",
  },
  {
    _id: "u3",
    fullName: "Maria Santos",
    email: "maria.santos@gmail.com",
    phone: "09171234567",
    passwordHash: bcrypt.hashSync("Customer@123", SALT_ROUNDS),
    role: "customer",
    status: "active",
    createdAt: "2026-09-20T10:30:00.000Z",
  },
  {
    _id: "u4",
    fullName: "Paolo Garcia",
    email: "paolo.garcia@outlook.com",
    phone: "09451234567",
    passwordHash: bcrypt.hashSync("Customer@123", SALT_ROUNDS),
    role: "customer",
    status: "inactive", // deactivated account: cannot log in
    createdAt: "2026-09-22T14:00:00.000Z",
  },
];

module.exports = users;
