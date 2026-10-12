// layouts/AuthLayout.jsx
// Frame for the account pages (Login, Register, Forgot / Reset Password):
// a food photo with the POUND logo on one side, the page's form on the other.
// On phones the photo becomes a short banner above the form.

import { Outlet } from "react-router";
import { BRAND_MAIN, BRAND_SUB, TAGLINE } from "../config";
import { getImage } from "../utils/images";

const photo = getImage("about.jpg");

function AuthLayout() {
  return (
    <div className="auth-layout">
      <div
        className="auth-photo"
        style={photo ? { "--auth-image": `url(${photo})` } : undefined}
      >
        {/* Text logo, same as the home page hero */}
        <div className="hero-title">
          <span className="hero-title-main">{BRAND_MAIN}</span>
          <span className="hero-tagline">{TAGLINE}</span>
          <span className="hero-title-sub">{BRAND_SUB}</span>
        </div>
        <p className="auth-photo-text">Comfort food, made to order. Book your table online.</p>
      </div>

      {/* <Outlet /> is where the current page's form appears */}
      <div className="auth-panel">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
