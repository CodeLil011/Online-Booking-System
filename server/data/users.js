// data/users.js
// SAMPLE users. Used ONLY by seed.js (npm run seed) to fill MongoDB.
// 12 users: 1 admin, 2 staff, 9 customers (1 of them deactivated).
//
// Passwords are NEVER stored as plain text. bcrypt.hashSync() turns each
// demo password into a hash when this file loads.
//
// Demo login passwords (same for everyone with the same role):
//   Admin:    Admin@123
//   Staff:    Staff@123
//   Customer: Customer@123

const bcrypt = require("bcryptjs");
const { getToday, addDays } = require("../utils/dateUtils");

const SALT_ROUNDS = 10; // how much work bcrypt does; higher = slower to crack

const ADMIN_HASH = bcrypt.hashSync("Admin@123", SALT_ROUNDS);
const STAFF_HASH = bcrypt.hashSync("Staff@123", SALT_ROUNDS);
const CUSTOMER_HASH = bcrypt.hashSync("Customer@123", SALT_ROUNDS);

// Sign-up dates are counted back from TODAY, so the data always looks recent:
// joinedDaysAgo(60) = the account was created 60 days before the day you run the seed.
const joinedDaysAgo = (days) => `${addDays(getToday(), -days)}T02:00:00.000Z`;

const users = [
  // ----- Admin -----
  {
    _id: "u1",
    fullName: "Giuz Montaño",
    email: "giuz.montano@gmail.com",
    phone: "09285550202",
    passwordHash: ADMIN_HASH,
    role: "admin",
    status: "active",
    createdAt: joinedDaysAgo(75),
  },

  // ----- Staff -----
  {
    _id: "u2",
    fullName: "Marco Delos Reyes",
    email: "marco.delosreyes@gmail.com",
    phone: "09182223333",
    passwordHash: STAFF_HASH,
    role: "staff",
    status: "active",
    createdAt: joinedDaysAgo(74),
  },
  {
    _id: "u5",
    fullName: "Rene Baterbonia",
    email: "rene.baterbonia@gmail.com",
    phone: "09193334444",
    passwordHash: STAFF_HASH,
    role: "staff",
    status: "active",
    createdAt: joinedDaysAgo(70),
  },

  // ----- Customers -----
  {
    _id: "u3",
    fullName: "Maria Santos",
    email: "maria.santos@gmail.com",
    phone: "09171234567",
    passwordHash: CUSTOMER_HASH,
    role: "customer",
    status: "active",
    createdAt: joinedDaysAgo(60),
  },
  {
    _id: "u4",
    fullName: "Paolo Garcia",
    email: "paolo.garcia@outlook.com",
    phone: "09451234567",
    passwordHash: CUSTOMER_HASH,
    role: "customer",
    status: "inactive", // deactivated account: cannot log in
    createdAt: joinedDaysAgo(58),
  },
  {
    _id: "u6",
    fullName: "Kclei Umadhay",
    email: "kclei.umadhay@gmail.com",
    phone: "09175550101",
    passwordHash: CUSTOMER_HASH,
    role: "customer",
    status: "active",
    createdAt: joinedDaysAgo(55),
  },
  {
    _id: "u8",
    fullName: "Khalil Espiritu",
    email: "khalil.espiritu@yahoo.com",
    phone: "09155550303",
    passwordHash: CUSTOMER_HASH,
    role: "customer",
    status: "active",
    createdAt: joinedDaysAgo(52),
  },
  {
    _id: "u9",
    fullName: "Al-vi Ebdane",
    email: "alvi.ebdane@gmail.com",
    phone: "09995550404",
    passwordHash: CUSTOMER_HASH,
    role: "customer",
    status: "active",
    createdAt: joinedDaysAgo(50),
  },
  {
    _id: "u10",
    fullName: "Giian Medina",
    email: "giian.medina@outlook.com",
    phone: "09175550505",
    passwordHash: CUSTOMER_HASH,
    role: "customer",
    status: "active",
    createdAt: joinedDaysAgo(48),
  },
  {
    _id: "u11",
    fullName: "Syd Villanueva",
    email: "syd.villanueva@gmail.com",
    phone: "09265550606",
    passwordHash: CUSTOMER_HASH,
    role: "customer",
    status: "active",
    createdAt: joinedDaysAgo(46),
  },
  {
    _id: "u12",
    fullName: "Carlo Valino",
    email: "carlo.valino@yahoo.com",
    phone: "09455550707",
    passwordHash: CUSTOMER_HASH,
    role: "customer",
    status: "active",
    createdAt: joinedDaysAgo(45),
  },
  {
    _id: "u13",
    fullName: "Jhoshua Gacud",
    email: "jhoshua.gacud@gmail.com",
    phone: "09175550808",
    passwordHash: CUSTOMER_HASH,
    role: "customer",
    status: "active",
    createdAt: joinedDaysAgo(44),
  },
];

module.exports = users;
