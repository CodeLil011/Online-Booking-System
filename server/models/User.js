// models/User.js
// The shape of a user account in MongoDB (Admin, Staff, or Customer).

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true }, // never the plain password
    role: { type: String, enum: ["admin", "staff", "customer"], default: "customer" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // Password reset (Step 15): only the HASH of the token is saved
    resetTokenHash: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },

    // Archive (Step 26)
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    versionKey: false, // no "__v" field
  }
);

// Whenever a user is sent as JSON, remove the secret fields automatically
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.resetTokenHash;
    delete ret.resetTokenExpires;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
