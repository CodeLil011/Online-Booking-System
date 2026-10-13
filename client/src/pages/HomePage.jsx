// The single scrolling page: Home -> About -> Menu -> Book Now -> Location.
// Each <section> has an id so the navbar can scroll to it (e.g. "/#menu").
// Text (story, menu, address, hours) comes from config.js; photos from client/src/assets/.

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BRAND_MAIN,
  BRAND_SUB,
  TAGLINE,
  ABOUT_TEXT,
  HIGHLIGHTS,
  MENU_ITEMS,
  ADDRESS,
  PHONE,
  CONTACT_EMAIL,
  OPENING_HOURS,
  MAP_QUERY,
} from "../config";
import { getImage } from "../utils/images";
import { formatPrice } from "../utils/formatPrice";
import BookingForm from "../components/BookingForm";
import MenuCarousel from "../components/MenuCarousel";
import MenuItemDetails from "../components/MenuItemDetails";
import Photo from "../components/Photo";
import OpenStatusBadge from "../components/OpenStatusBadge";
import { useHomeAnimations } from "../hooks/useHomeAnimations";

const heroImage = getImage("hero.jpg");
const logoImage = getImage("logo.png");

// Google Maps links (free, no account or API key needed)
const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAP_QUERY)}`;

function HomePage() {
  const location = useLocation();
  // The dish shown in the details pop-up (null = pop-up closed)
  const [selectedItem, setSelectedItem] = useState(null);
  
  // GSAP animations (hero entrance, scroll reveal, parallax) for everything inside pageRef
  const pageRef = useRef(null);
  useHomeAnimations(pageRef);

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
    <div ref={pageRef}>

      {/* HERO: full-width food photo with the logo and tagline on top.
          The photo is a CSS background so the text can sit over it. It's passed
          to the CSS as the --hero-image variable; index.css adds the dark layer
          on top (its darkness is --hero-dim-top / --hero-dim-bottom in :root).
          Without hero.jpg the plain dark background is used instead. */}
      <section
        id="home"
        className="hero"
        style={heroImage ? { "--hero-image": `url(${heroImage})` } : undefined}
      >
                {/* Separate photo layer, so GSAP can move it for the parallax effect */}
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-content">
          {logoImage ? (
            <img src={logoImage} alt={`${BRAND_MAIN} ${BRAND_SUB}`} className="hero-logo" />
          ) : (
            // Text version of the real logo: POUND / boxed tagline / FLATTERIE
            <h1 className="hero-title">
              <span className="hero-title-main">{BRAND_MAIN}</span>
              <span className="hero-tagline">{TAGLINE}</span>
              <span className="hero-title-sub">{BRAND_SUB}</span>
            </h1>
          )}
          <div className="hero-actions">
            <Link to="/#book" className="btn">
              Book a Table
            </Link>
            <Link to="/#menu" className="btn btn-outline">
              View Menu
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT: story text + highlights, photo on the side */}
      <section id="about" className="section">
        <h2 className="section-title">About Us</h2>
        <div className="split-layout">
          <div>
            <p className="about-text">{ABOUT_TEXT}</p>
            <div className="highlights">
              {HIGHLIGHTS.map((highlight) => (
                <div key={highlight.title} className="highlight">
                  <h3>{highlight.title}</h3>
                  <p>{highlight.text}</p>
                </div>
              ))}
            </div>
          </div>
          <Photo file="about.jpg" alt="Inside the restaurant" className="side-photo" />
        </div>
      </section>

      {/* MENU: 3D rotating carousel on top, full menu list below.
          Clicking a card or a dish opens its details. */}
      <section id="menu" className="section">
        <h2 className="section-title">Menu</h2>
        <MenuCarousel items={MENU_ITEMS} onSelect={setSelectedItem} />
        <ul className="menu-list">
          {MENU_ITEMS.map((item) => (
            <li key={item.name}>
              <button type="button" className="menu-item" onClick={() => setSelectedItem(item)}>
                <span className="menu-item-header">
                  <span className="menu-item-name">{item.name}</span>
                  {item.price !== null && (
                    <span className="menu-price">{formatPrice(item.price)}</span>
                  )}
                </span>
                <span className="menu-item-description">{item.description}</span>
                <span className="menu-item-more">View details ›</span>
              </button>
            </li>
          ))}
        </ul>

        {selectedItem && (
          <MenuItemDetails item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </section>

      {/* BOOK NOW: photo on the left, booking form on the right */}
      <section id="book" className="section">
        <h2 className="section-title">Book a Table</h2>
        <div className="booking-layout">
          <Photo file="booking.jpg" alt="A table ready for guests" className="side-photo" />
          <BookingForm />
        </div>
      </section>

      {/* LOCATION: Google Map on the left; address, opening hours, contact on the right */}
      <section id="location" className="section">
        <h2 className="section-title">Visit Us</h2>
        <div className="location-layout">
          {/* An embedded Google Map: a small window to Google Maps inside our page */}
          <iframe
            className="location-map"
            title="Map showing the restaurant's location"
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />

          <div className="info-cards">
            <div className="card">
              <h3>Address</h3>
              <p>{ADDRESS}</p>
              {/* Opens Google Maps in a new tab with directions to the restaurant */}
              <a className="btn location-btn" href={directionsUrl} target="_blank" rel="noopener noreferrer">
                Get Directions ↗
              </a>
            </div>
            <div className="card">
              <h3>Opening Hours</h3>
              <p>{OPENING_HOURS}</p>
              <OpenStatusBadge />
            </div>
            <div className="card">
              <h3>Contact</h3>
              {/* tel: opens the phone app (call), mailto: opens the email app */}
              <p>
                <a className="contact-link" href={`tel:${PHONE.replace(/\s/g, "")}`}>
                  {PHONE}
                </a>
              </p>
              <p>
                <a className="contact-link" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
