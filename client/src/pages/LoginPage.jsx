// pages/LoginPage.jsx
// Login form for ALL roles.
// After login: Customer -> home (or the page they wanted), Staff/Admin -> dashboard.

import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Where to go after login:
  // the page they were trying to open, otherwise their role's main page
  const destinationFor = (role) =>
    location.state?.from || (role === "customer" ? "/" : "/dashboard");

  // Already logged in? No need to see the login form.
  if (user) {
    return <Navigate to={destinationFor(user.role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser from reloading the page
    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      navigate(destinationFor(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err.message); // e.g. "Invalid email or password"
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>Login</h1>
      <p className="muted">Sign in to book a table and manage your reservations.</p>

      {error && <div className="alert alert-error">{error}</div>}

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

        <div className="form-group">
          <label htmlFor="password">Password</label>
           <PasswordInput
            id="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="form-footer">
        <Link to="/forgot-password">Forgot password?</Link>
      </p>

      <p className="form-footer">
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}

export default LoginPage;
