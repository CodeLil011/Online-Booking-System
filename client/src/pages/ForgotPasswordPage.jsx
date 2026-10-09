// pages/ForgotPasswordPage.jsx
// Step 1 of password recovery: the user enters their email to get a reset link.

import { useState } from "react";
import { Link } from "react-router";
import { requestPasswordReset } from "../api/authApi";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message); // same message whether the email exists or not
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Forgot Password</h1>
      <p className="muted">
        Enter the email you used to register. We'll send you a link to set a new password.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="form-footer">
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;
