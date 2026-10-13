// seed.js
// Fills MongoDB with the sample data from the data/ folder.
// Run it with:  npm run seed
//
// WARNING: it DELETES everything in the users, tables, and reservations
// collections first, then inserts the sample data again (a full reset).
// Use it before testing and right before the presentation ("data cleanup").
//
// Before deleting anything, it CHECKS the sample data with the same rules as the
// real system (no table booked twice in a slot, the party fits the table, ...).
// If something is wrong, it stops and the database is not touched.

require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./models/User");
const Table = require("./models/Table");
const Reservation = require("./models/Reservation");
const { TIME_SLOTS, RESERVATION_STATUSES, ACTIVE_STATUSES } = require("./config/businessRules");
const { getToday } = require("./utils/dateUtils");

const sampleUsers = require("./data/users");
const sampleTables = require("./data/tables");
const sampleReservations = require("./data/reservations");

// The sample data uses short IDs like "u1" and "t5". MongoDB creates its own IDs,
// so we remember which new ID belongs to which old one: { "t5": ObjectId("...") }
const toIdMap = (samples, docs) =>
  Object.fromEntries(samples.map((sample, i) => [sample._id, docs[i]._id]));

// Copies a sample record WITHOUT its old "_id" (MongoDB will create a new one)
const withoutOldId = ({ _id, ...rest }) => rest;

// Checks the sample reservations. Returns a list of problems (empty = all good).
const checkSampleData = () => {
  const problems = [];
  const today = getToday();
  const usedSlots = {}; // "t5 2026-10-10 19:00" -> reservation id
  const customerSlots = {}; // "u3 2026-10-10 19:00" -> reservation id

  sampleReservations.forEach((r) => {
    const table = sampleTables.find((t) => t._id === r.table);
    const slot = `${r.date} ${r.time}`;

    if (!table) problems.push(`${r._id}: table ${r.table} does not exist`);
    if (!TIME_SLOTS.includes(r.time)) problems.push(`${r._id}: ${r.time} is not a time slot`);
    if (!RESERVATION_STATUSES.includes(r.status)) problems.push(`${r._id}: unknown status ${r.status}`);
    if (table && r.guests > table.capacity) {
      problems.push(`${r._id}: ${r.guests} guests don't fit table ${table.tableNumber} (${table.capacity} seats)`);
    }

    // The same table can't be used twice in the same slot (cancelled bookings don't count)
    if (r.status !== "Cancelled") {
      const key = `${r.table} ${slot}`;
      if (usedSlots[key]) problems.push(`${r._id}: table ${r.table} is already used by ${usedSlots[key]} on ${slot}`);
      usedSlots[key] = r._id;
    }

    // Upcoming active bookings can't be on an out-of-service table
    if (table && table.status !== "available" && ACTIVE_STATUSES.includes(r.status) && r.date >= today) {
      problems.push(`${r._id}: table ${table.tableNumber} is out of service`);
    }

    // Account bookings: the account must exist and be a customer,
    // and a customer can't hold two active bookings in the same slot
    if (r.customer) {
      const user = sampleUsers.find((u) => u._id === r.customer);
      if (!user || user.role !== "customer") problems.push(`${r._id}: ${r.customer} is not a customer account`);
      if (ACTIVE_STATUSES.includes(r.status)) {
        const key = `${r.customer} ${slot}`;
        if (customerSlots[key]) problems.push(`${r._id}: ${r.customer} already has ${customerSlots[key]} on ${slot}`);
        customerSlots[key] = r._id;
      }
    }
  });

  return problems;
};

// "Completed: 26, Cancelled: 5, ..."
const countBy = (list, field) =>
  Object.entries(
    list.reduce((counts, item) => ({ ...counts, [item[field]]: (counts[item[field]] || 0) + 1 }), {})
  )
    .map(([value, count]) => `${value}: ${count}`)
    .join(", ");

const seed = async () => {
  if (!process.env.MONGO_URI) {
    console.error("ERROR: MONGO_URI is missing in the .env file.");
    process.exit(1);
  }

  // 0. Check the sample data BEFORE touching the database
  const problems = checkSampleData();
  if (problems.length > 0) {
    console.error("ERROR: The sample data has problems. Nothing was changed:");
    problems.forEach((problem) => console.error(`  - ${problem}`));
    process.exit(1);
  }
  console.log("Sample data checked: no problems found");

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to database: ${mongoose.connection.name}`);

  // 1. Delete the old data
  await Reservation.deleteMany({});
  await Table.deleteMany({});
  await User.deleteMany({});
  console.log("Old data deleted");

  // 2. Tables
  const tableDocs = await Table.insertMany(sampleTables.map(withoutOldId));
  const tableIds = toIdMap(sampleTables, tableDocs);

  // 3. Users (archivedBy points to another user, so it is filled in afterwards)
  const userDocs = await User.insertMany(
    sampleUsers.map((u) => ({ ...withoutOldId(u), archivedBy: null }))
  );
  const userIds = toIdMap(sampleUsers, userDocs);

  for (const sample of sampleUsers.filter((u) => u.archivedBy)) {
    await User.updateOne({ _id: userIds[sample._id] }, { archivedBy: userIds[sample.archivedBy] });
  }

  // 4. Reservations: replace the old "t5"/"u3" IDs with the new MongoDB IDs
  const reservationDocs = await Reservation.insertMany(
    sampleReservations.map((r) => ({
      ...withoutOldId(r),
      table: tableIds[r.table],
      customer: r.customer ? userIds[r.customer] : null,
      archivedBy: r.archivedBy ? userIds[r.archivedBy] : null,
    }))
  );

  // 5. Summary
  console.log(
    `Inserted ${tableDocs.length} tables, ${userDocs.length} users, ${reservationDocs.length} reservations`
  );
  console.log(`  Users by role:        ${countBy(sampleUsers, "role")}`);
  console.log(`  Reservations by status: ${countBy(sampleReservations, "status")}`);
  console.log(`  Archived reservations:  ${sampleReservations.filter((r) => r.archived).length}`);

  await mongoose.disconnect();
  console.log("Done. The database now has the sample data.");
};

seed().catch(async (error) => {
  console.error(`ERROR: Seeding failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
