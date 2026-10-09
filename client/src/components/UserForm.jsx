// components/UserForm.jsx
// Form for ADDING or EDITING a user (used by the Admin in a Modal).
//   user = null      -> Add mode (password required)
//   user = {...}     -> Edit mode (fields pre-filled, no password field)
//   isSelf = true    -> the admin is editing their own account (role locked)
//   onSave(data)     -> the page sends the data to the backend
//   onCancel()       -> closes the form

import { useState } from "react";
import PasswordInput from "./PasswordInput";

const ROLE_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

function UserForm({ user, isSelf, onSave, onCancel }) {
  const isEdit = Boolean(user);

  // Start with the user's current values (Edit) or empty values (Add)
  const [form, setForm] = useState({
    fullName: user ? user.fullName : "",
    email: user ? user.email : "",
    phone: user ? user.phone : "",
    role: user ? user.role : "staff", // most new accounts the admin adds are staff
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const data = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role,
    };
    // Only new accounts get a password (the backend refuses passwords on edit)
    if (!isEdit) data.password = form.password;

    try {
      await onSave(data); // the page calls the API; if it succeeds, the modal closes
    } catch (err) {
      setError(err.message); // e.g. "An account with this email already exists"
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="09171234567"
          value={form.phone}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          disabled={isSelf}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {isSelf && <span className="form-hint">You cannot change your own role.</span>}
      </div>

      {/* Password only when ADDING a user */}
      {!isEdit && (
        <div className="form-group">
          <label htmlFor="password">Temporary Password</label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="At least 8 characters, letters and numbers"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
          <span className="form-hint">
            Give this to the user. They can change it later in My Profile.
          </span>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Add User"}
        </button>
      </div>
    </form>
  );
}

export default UserForm;
