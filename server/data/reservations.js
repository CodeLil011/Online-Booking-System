// data/reservations.js
// SAMPLE reservations. Used ONLY by seed.js (npm run seed) to fill MongoDB.
//
// 40 bookings that look like ~6 weeks of a real restaurant:
//   26 Completed (the guests dined; 2 of them archived)  -> "at least 20 completed transactions"
//    5 Cancelled (by the customer, rejected by staff, or a no-show; 1 archived)
//    1 Confirmed from YESTERDAY (staff still has to mark it Completed or No-show)
//    2 Confirmed for TODAY, and 6 upcoming (Pending or Confirmed)
//
// DATES ARE COUNTED FROM TODAY: day(-7) = 7 days before the day you run the seed,
// day(0) = today, day(3) = 3 days from now. So the demo always looks current.
//
// "table"    = short sample id of a table from data/tables.js
// "customer" = short sample id of the customer ACCOUNT (data/users.js),
//              or null for phone/walk-in bookings entered by staff.
// seed.js swaps these short ids for the real MongoDB ids and checks the data
// (no table booked twice in the same slot, the party fits the table, etc.).

const { getToday, addDays } = require("../utils/dateUtils");
const users = require("./users");

// "YYYY-MM-DD", counted from today
const day = (daysFromToday) => addDays(getToday(), daysFromToday);

// Booked by a customer ACCOUNT: name, email, and phone come from that account
const account = (userId) => {
  const user = users.find((u) => u._id === userId);
  return {
    customer: userId,
    customerName: user.fullName,
    customerEmail: user.email,
    customerPhone: user.phone,
  };
};

// Phone or walk-in booking entered by staff (no account)
const walkIn = (customerName, customerEmail, customerPhone) => ({
  customer: null,
  customerName,
  customerEmail,
  customerPhone,
});

// Archived by an admin/staff member, some days ago
const archivedBy = (userId, daysAgo) => ({
  archived: true,
  archivedAt: `${day(-daysAgo)}T09:00:00.000Z`,
  archivedBy: userId,
});

const bookings = [
  // ===== COMPLETED: the guests came and dined (26) =====
  { _id: "r1", ...account("u3"), table: "t5", date: day(-42), time: "19:00", guests: 4, specialRequest: "Birthday celebration", status: "Completed" },
  { _id: "r2", ...walkIn("Carlo Mendoza", "carlo.mendoza@gmail.com", "09191234567"), table: "t2", date: day(-40), time: "13:00", guests: 2, specialRequest: "Window seat if possible", status: "Completed", ...archivedBy("u1", 30) },
  { _id: "r3", ...account("u6"), table: "t1", date: day(-38), time: "11:00", guests: 2, status: "Completed", ...archivedBy("u2", 30) },
  { _id: "r4", ...account("u4"), table: "t6", date: day(-37), time: "19:00", guests: 3, status: "Completed" },
  { _id: "r5", ...account("u8"), table: "t9", date: day(-35), time: "17:00", guests: 6, specialRequest: "Team dinner", status: "Completed" },
  { _id: "r6", ...walkIn("Juan Dela Cruz", "juan.delacruz@yahoo.com", "09281234567"), table: "t3", date: day(-33), time: "13:00", guests: 2, status: "Completed" },
  { _id: "r7", ...account("u7"), table: "t7", date: day(-31), time: "19:00", guests: 4, status: "Completed" },
  { _id: "r8", ...account("u9"), table: "t12", date: day(-30), time: "17:00", guests: 9, specialRequest: "Family reunion, please prepare a high chair", status: "Completed" },
  { _id: "r9", ...account("u3"), table: "t3", date: day(-28), time: "17:00", guests: 2, status: "Completed" },
  { _id: "r10", ...account("u10"), table: "t8", date: day(-27), time: "13:00", guests: 4, status: "Completed" },
  { _id: "r11", ...account("u11"), table: "t1", date: day(-26), time: "19:00", guests: 2, specialRequest: "Anniversary dinner", status: "Completed" },
  { _id: "r12", ...walkIn("Angela Reyes", "angela.reyes@gmail.com", "09981234567"), table: "t10", date: day(-24), time: "13:00", guests: 6, specialRequest: "Please prepare a high chair for a toddler", status: "Completed" },
  { _id: "r13", ...account("u12"), table: "t5", date: day(-23), time: "11:00", guests: 3, status: "Completed" },
  { _id: "r14", ...account("u13"), table: "t6", date: day(-21), time: "15:00", guests: 4, status: "Completed" },
  { _id: "r15", ...account("u6"), table: "t2", date: day(-20), time: "19:00", guests: 2, status: "Completed" },
  { _id: "r16", ...walkIn("Ramon Bautista", "ramon.bautista@gmail.com", "09391234567"), table: "t9", date: day(-19), time: "19:00", guests: 5, status: "Completed" },
  { _id: "r17", ...account("u7"), table: "t4", date: day(-17), time: "13:00", guests: 2, status: "Completed" },
  { _id: "r18", ...account("u8"), table: "t7", date: day(-16), time: "17:00", guests: 4, status: "Completed" },
  { _id: "r19", ...account("u3"), table: "t10", date: day(-14), time: "19:00", guests: 6, specialRequest: "Family dinner", status: "Completed" },
  { _id: "r20", ...account("u9"), table: "t1", date: day(-12), time: "11:00", guests: 1, status: "Completed" },
  { _id: "r21", ...account("u11"), table: "t8", date: day(-10), time: "19:00", guests: 4, status: "Completed" },
  { _id: "r22", ...walkIn("Lorna Castillo", "lorna.castillo@outlook.com", "09171239876"), table: "t12", date: day(-9), time: "13:00", guests: 8, specialRequest: "Office lunch", status: "Completed" },
  { _id: "r23", ...account("u10"), table: "t5", date: day(-7), time: "17:00", guests: 4, status: "Completed" },
  { _id: "r24", ...account("u13"), table: "t3", date: day(-5), time: "19:00", guests: 2, status: "Completed" },
  { _id: "r25", ...account("u12"), table: "t6", date: day(-3), time: "13:00", guests: 3, status: "Completed" },
  { _id: "r26", ...account("u6"), table: "t9", date: day(-2), time: "19:00", guests: 6, specialRequest: "Birthday surprise, please bring a candle", status: "Completed" },

  // ===== CANCELLED (5) =====
  { _id: "r27", ...account("u4"), table: "t6", date: day(-36), time: "19:00", guests: 4, status: "Cancelled", cancelledBy: "customer", cancellationReason: "Schedule conflict" },
  { _id: "r28", ...walkIn("Mark Lim", "mark.lim@gmail.com", "09221234567"), table: "t10", date: day(-25), time: "19:00", guests: 6, status: "Cancelled", cancelledBy: "staff", cancellationReason: "Fully booked for a private event", ...archivedBy("u2", 20) },
  { _id: "r29", ...account("u7"), table: "t2", date: day(-15), time: "17:00", guests: 2, status: "Cancelled", cancelledBy: "customer", cancellationReason: "Change of plans" },
  { _id: "r30", ...walkIn("Ben Torres", "ben.torres@yahoo.com", "09331234567"), table: "t7", date: day(-8), time: "19:00", guests: 4, status: "Cancelled", cancelledBy: "staff", cancellationReason: "Customer did not arrive (no-show)" },
  { _id: "r31", ...account("u8"), table: "t5", date: day(-4), time: "19:00", guests: 4, status: "Cancelled", cancelledBy: "customer", cancellationReason: "Not feeling well" },

  // ===== YESTERDAY, still Confirmed: staff can mark it Completed or No-show (1) =====
  { _id: "r32", ...account("u11"), table: "t4", date: day(-1), time: "19:00", guests: 2, status: "Confirmed" },

  // ===== TODAY (2) =====
  { _id: "r33", ...account("u3"), table: "t5", date: day(0), time: "19:00", guests: 4, specialRequest: "Quiet table if possible", status: "Confirmed" },
  { _id: "r34", ...walkIn("Pia Ramos", "pia.ramos@gmail.com", "09271234567"), table: "t2", date: day(0), time: "17:00", guests: 2, status: "Confirmed" },

  // ===== UPCOMING (6) =====
  { _id: "r35", ...account("u9"), table: "t9", date: day(1), time: "19:00", guests: 5, specialRequest: "Celebrating a promotion", status: "Pending" },
  { _id: "r36", ...account("u10"), table: "t1", date: day(2), time: "13:00", guests: 2, status: "Pending" },
  { _id: "r37", ...account("u12"), table: "t12", date: day(3), time: "17:00", guests: 10, specialRequest: "Barkada night", status: "Confirmed" },
  { _id: "r38", ...account("u13"), table: "t6", date: day(5), time: "19:00", guests: 4, status: "Pending" },
  { _id: "r39", ...walkIn("Anna Cruz", "anna.cruz@gmail.com", "09351234567"), table: "t7", date: day(6), time: "11:00", guests: 3, status: "Pending" },
  { _id: "r40", ...account("u6"), table: "t3", date: day(7), time: "19:00", guests: 2, status: "Confirmed" },
];

// When each booking was made: a few days before its date, but never in the future
const reservations = bookings.map((booking, i) => {
  let bookedOn = addDays(booking.date, -(1 + (i % 5))); // 1 to 5 days before
  if (bookedOn > getToday()) bookedOn = getToday();
  return { specialRequest: "", ...booking, createdAt: `${bookedOn}T03:00:00.000Z` };
});

module.exports = reservations;
