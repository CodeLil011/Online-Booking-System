// components/ProtectedRoute.jsx
// Page guard. Wrap routes with it in App.jsx.
//   <ProtectedRoute />                     -> must be logged in
//   <ProtectedRoute roles={["admin"]} />   -> must be logged in AND have one of these roles
// redirectTo = where to send users with the wrong role (default: home page)

import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ roles, redirectTo = "/" }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still checking the saved token: wait before deciding
  if (loading) {
    return <p className="page muted">Loading...</p>;
  }

  // Not logged in: go to Login, and remember which page they wanted
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Logged in but wrong role: send them away
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  // Allowed: show the page
  return <Outlet />;
}

export default ProtectedRoute;
