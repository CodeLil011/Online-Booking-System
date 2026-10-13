// components/Navbar.jsx
// Top navigation bar (matches the draft): logo left, section links centered,
// profile icon right. The profile icon opens Login, or a menu when logged in.

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { BRAND_MAIN, BRAND_SUB } from "../config";
import { useAuth } from "../context/AuthContext";
import { getImage } from "../utils/images";
import { useActiveSection } from "../hooks/useActiveSection";

const logoImage = getImage("logo.png");

// The home page sections in the navbar: id of the <section> on the home page + link text
const NAV_LINKS = [
  { id: "home", label: "Home", to: "/" },
  { id: "about", label: "About", to: "/#about" },
  { id: "menu", label: "Menu", to: "/#menu" },
  { id: "book", label: "Book Now", to: "/#book" },
  { id: "location", label: "Visit Us", to: "/#location" },
];
const SECTION_IDS = NAV_LINKS.map((link) => link.id);
// The menu button icon for phones: three lines (☰), or an X when the menu is open
function MenuIcon({ open }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

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
    // Phones only: is the list of section links (☰ menu) open?
  const [linksOpen, setLinksOpen] = useState(false);
  // Scroll spy: which section is on screen (only on the home page)
  const location = useLocation();
  const onHomePage = location.pathname === "/";
  const activeSection = useActiveSection(SECTION_IDS, onHomePage);

  // Is the navbar over the hero photo? Then it is transparent (home page only).
  // As soon as the bottom of the hero scrolls up behind the navbar, it turns brown.
  const [overHero, setOverHero] = useState(false);

  useEffect(() => {
    if (!onHomePage) {
      setOverHero(false);
      return;
    }

    const checkHero = () => {
      const hero = document.getElementById("home");
      // 80px = a little more than the navbar's height
      setOverHero(Boolean(hero) && hero.getBoundingClientRect().bottom > 80);
    };

    checkHero();
    window.addEventListener("scroll", checkHero, { passive: true });
    window.addEventListener("resize", checkHero);
    return () => {
      window.removeEventListener("scroll", checkHero);
      window.removeEventListener("resize", checkHero);
    };
  }, [onHomePage]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  return (
    // Transparent over the hero, but never while the ☰ menu is open (the links need a background)
    <header
      className={`navbar${overHero && !linksOpen ? " navbar-over-hero" : ""}${linksOpen ? " links-open" : ""}`}
    >
      {/* Logo: the logo.png image if it's in assets/, otherwise the name as text */}
            <Link to="/" className="navbar-brand" onClick={() => setLinksOpen(false)}>
        {logoImage ? (
          <img src={logoImage} alt={`${BRAND_MAIN} ${BRAND_SUB}`} className="navbar-logo" />
        ) : (
          <>
            <span className="navbar-brand-main">{BRAND_MAIN}</span>
            <span className="navbar-brand-sub">{BRAND_SUB}</span>
          </>
        )}
      </Link>

      {/* Links to SECTIONS of the home page. "/#menu" = home page, scrolled to id="menu".
          The link of the section on screen gets class="active" (highlighted). */}
            <nav id="site-links" className={linksOpen ? "navbar-links open" : "navbar-links"}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.id}
            to={link.to}
            className={activeSection === link.id ? "active" : undefined}
            aria-current={activeSection === link.id ? "location" : undefined}
            onClick={() => setLinksOpen(false)} // close the ☰ menu after choosing
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* ☰ button: only visible on phones (see index.css). Opens/closes the links above. */}
      <button
        type="button"
        className="navbar-toggle"
        onClick={() => {
          setLinksOpen(!linksOpen);
          setMenuOpen(false); // don't show both menus at once
        }}
        aria-label={linksOpen ? "Close menu" : "Open menu"}
        aria-expanded={linksOpen}
        aria-controls="site-links"
      >
        <MenuIcon open={linksOpen} />
      </button>


      {/* Profile icon: Login link when logged out, dropdown menu when logged in */}
      {user ? (
        <div className="profile-menu">
          <button
            className="navbar-profile"
            onClick={() => {
              setMenuOpen(!menuOpen);
              setLinksOpen(false); // don't show both menus at once
            }}
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
        <Link
          to="/login"
          className="navbar-profile"
          aria-label="Log in"
          onClick={() => setLinksOpen(false)} // close the ☰ panel when going to Login
        >
          <UserIcon />
        </Link>
      )}
    </header>
  );
}

export default Navbar;
