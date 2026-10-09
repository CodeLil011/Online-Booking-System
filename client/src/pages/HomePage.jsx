// The single scrolling page: Home -> About -> Menu -> Book Now -> Location.
// Each <section> has an id so the navbar can scroll to it (e.g. "/#menu").

import { useEffect } from "react";
import { useLocation } from "react-router";
import { RESTAURANT_NAME } from "../config";
import BookingForm from "../components/BookingForm";


function HomePage() {
  const location = useLocation();

  // Runs every time the URL changes.
  // If the URL has a #hash (e.g. "#menu"), scroll to the section with that id.
  // If not (just "/"), scroll back to the top.
  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.slice(1); // "#menu" -> "menu"
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  return (
    <>
      {/* HERO: big burger photo + logo + tagline (Step 9) */}
      <section id="home" className="section">
        <div className="placeholder placeholder-hero">
          HERO: food photo, {RESTAURANT_NAME} logo, and tagline (Step 9)
        </div>
      </section>

      {/* ABOUT: story text + highlights (Burgers / Flatbreads / Comfort Food) */}
      <section id="about" className="section">
        <h2>About</h2>
        <div className="placeholder">ABOUT: story text and highlights with photo (Step 9)</div>
      </section>

      {/* MENU: photo carousel + full menu */}
      <section id="menu" className="section">
        <h2>Menu</h2>
        <div className="placeholder">MENU: photo carousel and full menu (Step 9)</div>
      </section>

      {/* BOOK NOW: photo on the left, booking form on the right */}
      <section id="book" className="section">
        <h2>Book a Table</h2>
        <div className="booking-layout">
          <div className="placeholder">Food photo</div>
          <BookingForm />
        </div>
      </section>

      {/* LOCATION: address, opening hours, contact */}
      <section id="location" className="section">
        <h2>Visit Us</h2>
        <div className="placeholder">LOCATION: address, opening hours, contact (Step 9)</div>
      </section>
    </>
  );
}

export default HomePage;
