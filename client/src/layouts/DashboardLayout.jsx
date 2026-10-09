// layouts/DashboardLayout.jsx
// Frame for Staff/Admin pages: sidebar on the left, page on the right.

import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      {/* <Outlet /> is where the current dashboard page appears */}
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
