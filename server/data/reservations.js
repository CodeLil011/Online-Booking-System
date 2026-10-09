// data/reservations.js
// TEMPORARY in-memory reservations (replaced by MongoDB in Phase 9).
//
// "table"    = _id of a table from data/tables.js
// "customer" = _id of the customer ACCOUNT that made the booking (data/users.js),
//              or null when staff entered it for someone without an account
//              (phone or walk-in booking).

const reservations = [
  {
    _id: "r1",
    customer: "u3", // Maria Santos's account
    customerName: "Maria Santos",
    customerEmail: "maria.santos@gmail.com",
    customerPhone: "09171234567",
    table: "t5",
    date: "2026-10-10",
    time: "19:00",
    guests: 4,
    specialRequest: "Birthday celebration",
    status: "Confirmed",
    createdAt: "2026-10-02T09:15:00.000Z",
  },
  {
    _id: "r2",
    customer: null, // phone booking entered by staff
    customerName: "Juan Dela Cruz",
    customerEmail: "juan.delacruz@yahoo.com",
    customerPhone: "09281234567",
    table: "t1",
    date: "2026-10-10",
    time: "19:00",
    guests: 2,
    specialRequest: "",
    status: "Pending",
    createdAt: "2026-10-03T13:40:00.000Z",
  },
  {
    _id: "r3",
    customer: null,
    customerName: "Angela Reyes",
    customerEmail: "angela.reyes@gmail.com",
    customerPhone: "09981234567",
    table: "t10",
    date: "2026-10-12",
    time: "13:00",
    guests: 6,
    specialRequest: "Please prepare a high chair for a toddler",
    status: "Pending",
    createdAt: "2026-10-04T02:05:00.000Z",
  },
  {
    _id: "r4",
    customer: "u4", // Paolo Garcia's account
    customerName: "Paolo Garcia",
    customerEmail: "paolo.garcia@outlook.com",
    customerPhone: "09451234567",
    table: "t6",
    date: "2026-10-10",
    time: "19:00",
    guests: 3,
    specialRequest: "",
    status: "Cancelled",
    cancelledBy: "customer",
    cancellationReason: "Schedule conflict",
    createdAt: "2026-10-01T11:20:00.000Z",
  },
  {
    _id: "r5",
    customer: null,
    customerName: "Carlo Mendoza",
    customerEmail: "carlo.mendoza@gmail.com",
    customerPhone: "09191234567",
    table: "t2",
    date: "2026-09-28",
    time: "13:00",
    guests: 2,
    specialRequest: "Window seat if possible",
    status: "Completed",
    createdAt: "2026-09-25T08:30:00.000Z",
  },
  {
    _id: "r6",
    customer: null,
    customerName: "Ramon Bautista",
    customerEmail: "ramon.bautista@gmail.com",
    customerPhone: "09561234567",
    table: "t8",
    date: "2026-10-04",
    time: "19:00",
    guests: 4,
    specialRequest: "",
    status: "Confirmed",
    createdAt: "2026-09-30T10:00:00.000Z",
  },
  {
    _id: "r7",
    customer: "u3", // Maria's PAST visit (shows in her history)
    customerName: "Maria Santos",
    customerEmail: "maria.santos@gmail.com",
    customerPhone: "09171234567",
    table: "t3",
    date: "2026-09-26",
    time: "17:00",
    guests: 2,
    specialRequest: "",
    status: "Completed",
    createdAt: "2026-09-21T07:45:00.000Z",
  },
];

module.exports = reservations;
