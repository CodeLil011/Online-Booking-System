// components/Footer.jsx
// Bottom of every public page.

import { RESTAURANT_NAME } from "../config";

function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} {RESTAURANT_NAME} Reservation System
      </p>
      <p>
        Student academic project for demonstration only. Not affiliated with the actual
        restaurant.
      </p>
      {/* Credit for the content we used (no link: this is a mock-up project) */}
      <p className="footer-credit">
        Menu items, photos, and prices are based on {RESTAURANT_NAME} and are used for academic
        purposes only.
      </p>
    </footer>
  );
}

export default Footer;
