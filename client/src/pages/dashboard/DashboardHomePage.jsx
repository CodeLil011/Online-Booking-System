// pages/dashboard/DashboardHomePage.jsx
// Overview: today's numbers, today's reservations, and pending requests at a glance.
// No new backend route: it combines 3 existing API calls.

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getReservations } from "../../api/reservationApi";
import { getTables } from "../../api/tableApi";
import { formatDate, formatTime, getTodayString, getNowString } from "../../utils/dateHelpers";

const ACTIVE_STATUSES = ["Pending", "Confirmed"];

function DashboardHomePage() {
  const { user } = useAuth();

  const [todayList, setTodayList] = useState([]); // all of today's reservations
  const [pendingList, setPendingList] = useState([]); // all Pending reservations
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = getTodayString();

  // Load the 3 lists at the same time
  useEffect(() => {
    Promise.all([
      getReservations({ date: today }),
      getReservations({ status: "Pending" }),
      getTables(),
    ])
      .then(([todayData, pendingData, tableData]) => {
        setTodayList(todayData);
        setPendingList(pendingData);
        setTables(tableData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [today]);

  // ----- Numbers for the summary cards -----
  const now = getNowString();
  const activeToday = todayList.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const guestsToday = activeToday.reduce((sum, r) => sum + r.guests, 0);
  // Only pending requests whose time has NOT passed still need an answer
  const pendingUpcoming = pendingList.filter((r) => `${r.date} ${r.time}` > now);
  const tablesInService = tables.filter((t) => t.status === "available").length;

  const cards = [
    { label: "Bookings today", value: activeToday.length, note: "Pending + Confirmed" },
    { label: "Guests expected today", value: guestsToday, note: "From today's bookings" },
    { label: "Pending requests", value: pendingUpcoming.length, note: "Waiting for confirmation" },
    {
      label: "Tables in service",
      value: `${tablesInService} / ${tables.length}`,
      note: "Ready for guests",
    },
  ];

  const firstName = user.fullName.split(" ")[0];

  if (loading) return <p className="muted">Loading overview...</p>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome, {firstName}</h1>
          <p className="muted">{formatDate(today)}</p>
        </div>
        <Link to="/dashboard/reservations" className="btn">
          Manage Reservations
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary cards */}
      <div className="stat-grid">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <span className="stat-label">{card.label}</span>
            <strong className="stat-value">{card.value}</strong>
            <span className="muted stat-note">{card.note}</span>
          </div>
        ))}
      </div>

      {/* Today's reservations (all statuses, earliest time first) */}
      <section className="dashboard-section">
        <h2>Today's Reservations</h2>
        {todayList.length === 0 ? (
          <p className="muted">No reservations for today.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Guests</th>
                  <th>Table</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayList.map((r) => (
                  <tr key={r._id}>
                    <td>{formatTime(r.time)}</td>
                    <td>
                      {r.customerName}
                      <div className="cell-sub">{r.customerPhone}</div>
                    </td>
                    <td>{r.guests}</td>
                    <td>{r.table ? `Table ${r.table.tableNumber}` : "-"}</td>
                    <td>
                      <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pending requests: the 5 soonest ones */}
      <section className="dashboard-section">
        <h2>Pending Requests</h2>
        {pendingUpcoming.length === 0 ? (
          <p className="muted">No pending requests. All caught up!</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Guests</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUpcoming.slice(0, 5).map((r) => (
                    <tr key={r._id}>
                      <td>{formatDate(r.date)}</td>
                      <td>{formatTime(r.time)}</td>
                      <td>{r.customerName}</td>
                      <td>{r.guests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <Link to="/dashboard/reservations">Go to Reservations to confirm or reject →</Link>
            </p>
          </>
        )}
      </section>
    </div>
  );
}

export default DashboardHomePage;
