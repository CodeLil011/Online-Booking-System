// pages/ProfilePage.jsx
// My Profile: view account info, edit name/email/phone, and change password.
// Uses PUT /api/auth/me and PUT /api/auth/me/password (built in Step 12).

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateMyProfile, changeMyPassword } from "../api/authApi";
import PasswordInput from "../components/PasswordInput";

function ProfilePage() {
  // ProtectedRoute guarantees that a user is logged in on this page
  const { user, updateUser } = useAuth();

  // ===================== Form 1: Account information =====================
  const [info, setInfo] = useState({
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
  });
  const [infoMessage, setInfoMessage] = useState("");
  const [infoError, setInfoError] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const handleInfoChange = (e) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoMessage("");
    setInfoError("");
    setSavingInfo(true);

    try {
      const updatedUser = await updateMyProfile(info);
      updateUser(updatedUser); // navbar shows the new name right away
      setInfoMessage("Profile updated successfully.");
    } catch (err) {
      setInfoError(err.message);
    } finally {
      setSavingInfo(false);
    }
  };

  // ===================== Form 2: Change password =====================
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    // Check in the browser first: do the two new passwords match?
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      await changeMyPassword(passwords.currentPassword, passwords.newPassword);
      setPasswordMessage("Password changed successfully.");
      // Clear the fields so the passwords don't stay on screen
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  // "2026-09-20T10:30:00.000Z" -> "September 20, 2026"
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="page">
      <h1>My Profile</h1>
      <p className="muted">Manage your account information and password.</p>

      <div className="profile-grid">
        {/* ---------- Card 1: Account information ---------- */}
        <section className="card">
          <h2>Account Information</h2>

          {/* Read-only details (users cannot change their own role) */}
          <div className="info-list">
            <div className="info-row">
              Role <strong>{user.role}</strong>
            </div>
            <div className="info-row">
              Member since <strong>{memberSince}</strong>
            </div>
          </div>

          {infoError && <div className="alert alert-error">{infoError}</div>}
          {infoMessage && <div className="alert alert-success">{infoMessage}</div>}

          <form className="form" onSubmit={handleInfoSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                value={info.fullName}
                onChange={handleInfoChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={info.email}
                onChange={handleInfoChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={info.phone}
                onChange={handleInfoChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-block" disabled={savingInfo}>
              {savingInfo ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>

        {/* ---------- Card 2: Change password ---------- */}
        <section className="card">
          <h2>Change Password</h2>

          {passwordError && <div className="alert alert-error">{passwordError}</div>}
          {passwordMessage && <div className="alert alert-success">{passwordMessage}</div>}

          <form className="form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <PasswordInput
                id="currentPassword"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                placeholder="At least 8 characters, letters and numbers"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-block" disabled={savingPassword}>
              {savingPassword ? "Changing..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
