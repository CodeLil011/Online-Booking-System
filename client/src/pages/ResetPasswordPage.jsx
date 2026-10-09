// pages/ResetPasswordPage.jsx
// Step 2 of password recovery: opened from the reset link.
// The URL looks like /reset-password/<token>; useParams() reads the token.
// The link is checked as soon as the page opens.

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { checkResetLink, resetPassword } from "../api/authApi";
import PasswordInput from "../components/PasswordInput";

function ResetPasswordPage() {
  const { token } = useParams(); // the secret part of the link

  const [checking, setChecking] = useState(true); // true while checking the link
  const [linkError, setLinkError] = useState(""); // set if the link is invalid/expired
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // When the page opens: ask the server if this link is still valid
  useEffect(() => {
    checkResetLink(token)
      .catch((err) => setLinkError(err.message))
      .finally(() => setChecking(false));
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetPassword(token, form.newPassword);
      setSuccessMessage(result.message);
    } catch (err) {
      setError(err.message); // e.g. the link expired while the page was open
    } finally {
      setSubmitting(false);
    }
  };

  // 1. After a successful reset: show the message and a button to log in
  if (successMessage) {
    return (
      <div className="auth-card">
        <h1>Password Reset</h1>
        <div className="alert alert-success">{successMessage}</div>
        <Link to="/login" className="btn btn-block">
          Go to Login
        </Link>
      </div>
    );
  }

  // 2. Still checking the link
  if (checking) {
    return (
      <div className="auth-card">
        <p className="muted">Checking your reset link...</p>
      </div>
    );
  }

  // 3. The link is invalid, already used, or expired: no form, just a way forward
  if (linkError) {
    return (
      <div className="auth-card">
        <h1>Link Not Valid</h1>
        <div className="alert alert-error">{linkError}</div>
        <Link to="/forgot-password" className="btn btn-block">
          Request a New Link
        </Link>
      </div>
    );
  }

  // 4. The link is valid: show the form
  return (
    <div className="auth-card">
      <h1>Set a New Password</h1>
      <p className="muted">Choose a new password for your account.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            placeholder="At least 8 characters, letters and numbers"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? "Saving..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
