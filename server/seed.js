// seed.js
// Fills MongoDB with the sample data from the data/ folder.
// Run it with:  npm run seed
//
// WARNING: it DELETES everything in the users, tables, and reservations
// collections first, then inserts the sample data again (a full reset).

require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./models/User");
const Table = require("./models/Table");
const Reservation = require("./models/Reservation");

const sampleUsers = require("./data/users");
const sampleTables = require("./data/tables");
const sampleReservations = require("./data/reservations");

// The sample data uses short IDs like "u1" and "t5". MongoDB creates its own IDs,
// so we remember which new ID belongs to which old one: { "t5": ObjectId("...") }
const toIdMap = (samples, docs) =>
  Object.fromEntries(samples.map((sample, i) => [sample._id, docs[i]._id]));

// Copies a sample record WITHOUT its old "_id" (MongoDB will create a new one)
const withoutOldId = ({ _id, ...rest }) => rest;

const seed = async () => {
  if (!process.env.MONGO_URI) {
    console.error("ERROR: MONGO_URI is missing in the .env file.");
    process.exit(1);
  }

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

  console.log(
    `Inserted ${tableDocs.length} tables, ${userDocs.length} users, ${reservationDocs.length} reservations`
  );

  await mongoose.disconnect();
  console.log("Done. The database now has the sample data.");
};

seed().catch(async (error) => {
  console.error(`ERROR: Seeding failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
