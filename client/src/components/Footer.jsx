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
    </footer>
  );
}

export default Footer;
