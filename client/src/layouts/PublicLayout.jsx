// layouts/PublicLayout.jsx
// Frame for public pages: navbar on top, page in the middle, footer at the bottom.

import { Outlet } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function PublicLayout() {
  return (
    <div className="public-layout">
      <Navbar />

      {/* <Outlet /> is where the current page (Home, Login, ...) appears */}
      <main className="public-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default PublicLayout;
