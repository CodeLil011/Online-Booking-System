// components/Navbar.jsx
// Top navigation bar (matches the draft): logo left, section links centered,
// profile icon right. The profile icon opens Login, or a menu when logged in.

import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { BRAND_MAIN, BRAND_SUB } from "../config";
import { useAuth } from "../context/AuthContext";

// The round "person" icon, drawn with SVG
function UserIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 18.5c1.2-2.2 3.2-3.5 5.5-3.5s4.3 1.3 5.5 3.5" />
    </svg>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  return (
    <header className="navbar">
      {/* Logo (text for now; the logo image is added later) */}
      <Link to="/" className="navbar-brand">
        <span className="navbar-brand-main">{BRAND_MAIN}</span>
        <span className="navbar-brand-sub">{BRAND_SUB}</span>
      </Link>

      {/* Links to SECTIONS of the home page. "/#menu" = home page, scrolled to id="menu" */}
      <nav className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/#about">About</Link>
        <Link to="/#menu">Menu</Link>
        <Link to="/#book">Book Now</Link>
      </nav>

      {/* Profile icon: Login link when logged out, dropdown menu when logged in */}
      {user ? (
        <div className="profile-menu">
          <button
            className="navbar-profile"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Account menu"
          >
            <UserIcon />
          </button>

          {menuOpen && (
            <div className="profile-dropdown">
              <p className="profile-name">
                {user.fullName}
                <span>{user.role}</span>
              </p>

              {user.role === "customer" ? (
                <Link to="/my-reservations" onClick={closeMenu}>
                  My Reservations
                </Link>
              ) : (
                <Link to="/dashboard" onClick={closeMenu}>
                  Dashboard
                </Link>
              )}

              <Link to="/profile" onClick={closeMenu}>
                My Profile
              </Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      ) : (
        <Link to="/login" className="navbar-profile" aria-label="Log in">
          <UserIcon />
        </Link>
      )}
    </header>
  );
}

export default Navbar;
