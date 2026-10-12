// App.jsx
// The list of all pages (routes) in the app.
// ProtectedRoute wraps pages that need a login (and sometimes a specific role).

import { Routes, Route } from "react-router";

// Layouts (shared page frames)
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout from "./layouts/AuthLayout";

// Page guard
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MyReservationsPage from "./pages/MyReservationsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

// Dashboard pages (Staff/Admin)
import DashboardHomePage from "./pages/dashboard/DashboardHomePage";
import ManageReservationsPage from "./pages/dashboard/ManageReservationsPage";
import ManageTablesPage from "./pages/dashboard/ManageTablesPage";
import CustomersPage from "./pages/dashboard/CustomersPage";
import ManageUsersPage from "./pages/dashboard/ManageUsersPage";
import ArchivePage from "./pages/dashboard/ArchivePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";


function App() {
  return (
    <Routes>
      {/* PUBLIC SITE: shown inside PublicLayout (navbar + footer) */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />

        {/* Account pages: photo + logo next to the form (AuthLayout) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Route>


        {/* Customers only */}
        <Route element={<ProtectedRoute roles={["customer"]} />}>
          <Route path="/my-reservations" element={<MyReservationsPage />} />
        </Route>

        {/* Any logged-in user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* DASHBOARD: Staff and Admin only, shown inside DashboardLayout (sidebar) */}
      <Route element={<ProtectedRoute roles={["admin", "staff"]} />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route path="reservations" element={<ManageReservationsPage />} />
          <Route path="tables" element={<ManageTablesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="archive" element={<ArchivePage />} />

          {/* Admin only */}
          <Route element={<ProtectedRoute roles={["admin"]} redirectTo="/dashboard" />}>
            <Route path="users" element={<ManageUsersPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
