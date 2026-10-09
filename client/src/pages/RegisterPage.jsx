// pages/RegisterPage.jsx
// Registration form: creates CUSTOMER accounts only.
// After registering, the customer is logged in automatically.

import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  // All form fields in ONE state object
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? No need to register.
  if (user) {
    return <Navigate to="/" replace />;
  }

  // One change handler for every input: uses the input's "name" to know which field changed
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check in the browser first: do the two passwords match?
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      // confirmPassword is only for this form; the backend doesn't need it
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message); // e.g. "An account with this email already exists"
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Create an Account</h1>
      <p className="muted">Register to book tables online.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            name="fullName"
            placeholder="Enter your name here"
            value={form.fullName}
            onChange={handleChange}
            autoComplete="name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
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
            autoComplete="tel"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
           <PasswordInput
            id="password"
            name="password"
            placeholder="At least 8 characters, letters and numbers"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Type your password again"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />
        </div>

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="form-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
