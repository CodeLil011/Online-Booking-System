// utils/validators.js
// Validation rules shared by several controllers, written in ONE place.

// Simple email check: something@something.something
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Philippine mobile number: 09171234567 or +639171234567
const PH_MOBILE_PATTERN = /^(09|\+639)\d{9}$/;

// Password rule: at least 8 characters, with at least one letter and one number.
// Returns an error message, or null if OK.
const validatePassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return "password must be at least 8 characters";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "password must contain at least one letter and one number";
  }
  return null;
};

// Makes typed search text safe to use inside a MongoDB "contains" search
// (characters like "." or "+" have special meanings there)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { EMAIL_PATTERN, PH_MOBILE_PATTERN, validatePassword, escapeRegex };
