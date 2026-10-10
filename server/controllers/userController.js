// controllers/userController.js
// Admin-only user management: list, view, add, edit, change role, activate/deactivate.

const bcrypt = require("bcryptjs");
const users = require("../data/users");
const { toPublicUser } = require("../utils/authUtils");
const { EMAIL_PATTERN, PH_MOBILE_PATTERN, validatePassword } = require("../utils/validators");

const SALT_ROUNDS = 10;
const ROLES = ["admin", "staff", "customer"];
const STATUSES = ["active", "inactive"];
const EDITABLE_FIELDS = ["fullName", "email", "phone", "role", "status"];

// ---------- Helper functions ----------

// Finds a user by email (not case-sensitive)
const findUserByEmail = (email) =>
  users.find((u) => u.email === email.trim().toLowerCase());

// Checks user fields. Returns a list of error messages.
// isUpdate = true -> only check the fields that were sent
const validateUserData = (data, isUpdate = false) => {
  const { fullName, email, phone, role, status } = data;
  const errors = [];

  if (!isUpdate || fullName !== undefined) {
    if (typeof fullName !== "string" || fullName.trim().length < 2) {
      errors.push("fullName must be at least 2 characters");
    }
  }
  if (!isUpdate || email !== undefined) {
    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
      errors.push("email must be a valid email address");
    }
  }
  if (!isUpdate || phone !== undefined) {
    if (typeof phone !== "string" || !PH_MOBILE_PATTERN.test(phone)) {
      errors.push("phone must be a valid PH mobile number (e.g. 09171234567)");
    }
  }
  if (!isUpdate || role !== undefined) {
    if (!ROLES.includes(role)) {
      errors.push(`role must be one of: ${ROLES.join(", ")}`);
    }
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    errors.push(`status must be one of: ${STATUSES.join(", ")}`);
  }

  return errors;
};

// How many ACTIVE admins exist (at least one must always remain)
const countActiveAdmins = () =>
  users.filter((u) => u.role === "admin" && u.status === "active").length;

// ---------- Controller functions ----------

// GET /api/users
// Optional filters: ?role=staff  ?status=inactive  ?search=santos (name or email)
const getAllUsers = (req, res) => {
  const { role, status, search } = req.query;

  if (role && !ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `role must be one of: ${ROLES.join(", ")}`,
    });
  }
  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${STATUSES.join(", ")}`,
    });
  }

 // Archived accounts are hidden here (they appear on the Archive page instead)
  let result = users.filter((u) => !u.archived);
  if (role) result = result.filter((u) => u.role === role);
  if (status) result = result.filter((u) => u.status === status);
  if (search) {
    const text = search.trim().toLowerCase();
    result = result.filter(
      (u) => u.fullName.toLowerCase().includes(text) || u.email.includes(text)
    );
  }

  // Sort: admins first, then staff, then customers; alphabetical within each role
  const sorted = [...result].sort(
    (a, b) =>
      ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.fullName.localeCompare(b.fullName)
  );

  res.json({ success: true, count: sorted.length, data: sorted.map(toPublicUser) });
};

// GET /api/users/:id
const getUserById = (req, res) => {
  const user = users.find((u) => u._id === req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, data: toPublicUser(user) });
};

// POST /api/users
// The Admin creates an account with ANY role (this is how Staff accounts are made).
// Body: { fullName, email, phone, role, password, status? }
const createUser = async (req, res) => {
  const data = req.body || {};

  // 1. Validate all fields (role is required here)
  const errors = validateUserData(data);
  const passwordError = validatePassword(data.password);
  if (passwordError) errors.push(passwordError);

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // 2. Email must not be used by another account
  if (findUserByEmail(data.email)) {
    return res.status(409).json({
      success: false,
      message: "An account with this email already exists",
    });
  }

  // 3. Create the user with a HASHED password
  const newUser = {
    _id: `u${Date.now()}`, // temporary unique ID; MongoDB will generate _id later
    fullName: data.fullName.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone,
    passwordHash: await bcrypt.hash(data.password, SALT_ROUNDS),
    role: data.role,
    status: data.status || "active",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    message: `${newUser.role} account created`,
    data: toPublicUser(newUser),
  });
};

// PUT /api/users/:id
// Edit a user's details, role, or status. Only the fields that were sent are changed.
const updateUser = (req, res) => {
  // 1. Find the user
  const user = users.find((u) => u._id === req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Archived accounts must be restored from the Archive before they can be edited
  if (user.archived) {
    return res.status(400).json({
      success: false,
      message: "This account is archived. Restore it from the Archive first.",
    });
  }

  const data = req.body || {};

  // 2. Passwords are NOT changed here (users use My Profile or Forgot Password)
  if (data.password !== undefined) {
    return res.status(400).json({
      success: false,
      message: "Passwords cannot be changed here. The user can use Forgot Password.",
    });
  }

  // 3. Keep only the editable fields that were sent
  const changes = {};
  EDITABLE_FIELDS.forEach((field) => {
    if (data[field] !== undefined) changes[field] = data[field];
  });

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ success: false, message: "No changes were provided" });
  }

  // 4. Validate the fields that were sent
  const errors = validateUserData(changes, true);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // 5. A new email must not belong to ANOTHER account
  if (changes.email !== undefined) {
    const owner = findUserByEmail(changes.email);
    if (owner && owner._id !== user._id) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }
  }

  // 6. SAFETY RULES
  const isSelf = user._id === req.user._id; // is the admin editing their own account?

  if (isSelf && changes.role !== undefined && changes.role !== user.role) {
    return res.status(400).json({ success: false, message: "You cannot change your own role" });
  }
  if (isSelf && changes.status === "inactive") {
    return res.status(400).json({
      success: false,
      message: "You cannot deactivate your own account",
    });
  }

  // Would this change remove an ACTIVE admin? Then another active admin must exist.
  const removesActiveAdmin =
    user.role === "admin" &&
    user.status === "active" &&
    ((changes.role !== undefined && changes.role !== "admin") || changes.status === "inactive");

  if (removesActiveAdmin && countActiveAdmins() <= 1) {
    return res.status(400).json({
      success: false,
      message: "The system must always have at least one active admin",
    });
  }

  // 7. Apply the changes
  if (changes.fullName !== undefined) user.fullName = changes.fullName.trim();
  if (changes.email !== undefined) user.email = changes.email.trim().toLowerCase();
  if (changes.phone !== undefined) user.phone = changes.phone;
  if (changes.role !== undefined) user.role = changes.role;
  if (changes.status !== undefined) user.status = changes.status;
  user.updatedAt = new Date().toISOString();

  res.json({ success: true, message: "User updated", data: toPublicUser(user) });
};

module.exports = { getAllUsers, getUserById, createUser, updateUser };
