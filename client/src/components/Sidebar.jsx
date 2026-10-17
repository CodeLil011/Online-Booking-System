// components/Sidebar.jsx
// Left-side menu for the Staff/Admin dashboard.
// Shows the logged-in user, hides "Users" from Staff, and has a Logout button.

import { Link, NavLink, useNavigate } from "react-router";
import { BRAND_MAIN } from "../config";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="sidebar-brand">
        {BRAND_MAIN}
        {/* The label matches the role: Admin Dashboard or Staff Dashboard */}
        <span>{user.role === "admin" ? "Admin Dashboard" : "Staff Dashboard"}</span>
      </Link>

      {/* NavLink adds class="active" to the link of the current page */}
      <nav className="sidebar-links">
        <NavLink to="/dashboard" end>
          Overview
        </NavLink>
        <NavLink to="/dashboard/reservations">Reservations</NavLink>
        <NavLink to="/dashboard/tables">Tables</NavLink>
        <NavLink to="/dashboard/customers">Customers</NavLink>
        {/* Only the Admin sees "Users" */}
        {user.role === "admin" && <NavLink to="/dashboard/users">Users</NavLink>}
        <NavLink to="/dashboard/archive">Archive</NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <strong>{user.fullName}</strong>
          {user.role}
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
        <Link to="/" className="sidebar-back">
          ← Back to website
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;
