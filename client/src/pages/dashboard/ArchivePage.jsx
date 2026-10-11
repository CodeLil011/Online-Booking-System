// pages/dashboard/ArchivePage.jsx
// Archive: view, search, and restore archived records.
//   Tab "Reservations"  -> Staff/Admin (archived from Manage Reservations)
//   Tab "User Accounts" -> Admin only  (archived from Manage Users)

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getArchivedReservations,
  restoreReservation,
  getArchivedUsers,
  restoreUser,
} from "../../api/archiveApi";
import { formatDate, formatTime } from "../../utils/dateHelpers";
import { formatRef } from "../../utils/formatRef";

// "2026-10-01T09:00:00.000Z" -> "Oct 1, 2026"
const shortDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function ArchivePage() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [tab, setTab] = useState("reservations"); // "reservations" or "users"

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Archive</h1>
          <p className="muted">
            Old records moved out of the main lists. Nothing here is deleted and any record can be
            restored.
          </p>
        </div>
      </div>

      {/* Only the Admin sees the tabs (Staff only have archived reservations) */}
      {isAdmin && (
        <div className="tabs">
          <button
            className={`tab${tab === "reservations" ? " active" : ""}`}
            onClick={() => setTab("reservations")}
          >
            Reservations
          </button>
          <button
            className={`tab${tab === "users" ? " active" : ""}`}
            onClick={() => setTab("users")}
          >
            User Accounts
          </button>
        </div>
      )}

      {isAdmin && tab === "users" ? <ArchivedUsers /> : <ArchivedReservations />}
    </div>
  );
}

// ---------- Tab 1: archived reservations ----------
function ArchivedReservations() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null); // record being restored
  const [refreshKey, setRefreshKey] = useState(0);

  // Load on first load, when searching, and after a restore
  useEffect(() => {
    setLoading(true);
    setError("");

    getArchivedReservations(search)
      .then((data) => setRecords(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, refreshKey]);

  const handleRestore = async (r) => {
    if (!window.confirm(`Restore ${r.customerName}'s reservation (${formatRef(r._id)}) to the main list?`)) {
      return;
    }

    setError("");
    setMessage("");
    setBusyId(r._id);
    try {
      await restoreReservation(r._id);
      setMessage(`Reservation ${r._id} (${r.customerName}) was restored to Manage Reservations.`);
      setRefreshKey((key) => key + 1); // reload the list
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-group">
          <input
            type="search"
            placeholder="Search name, email, phone, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="muted">Showing {records.length} archived reservation(s)</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <p className="muted">Loading archive...</p>
      ) : records.length === 0 ? (
        <p className="muted">No archived reservations found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Guests</th>
                <th>Table</th>
                <th>Status</th>
                <th>Archived</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>
                    {formatDate(r.date)}
                    <span className="cell-sub">
                      {formatTime(r.time)} · Ref {formatRef(r._id)}
                    </span>
                  </td>
                  <td>
                    {r.customerName}
                    <span className="cell-sub">{r.customerPhone}</span>
                  </td>
                  <td>{r.guests}</td>
                  <td>{r.table ? `Table ${r.table.tableNumber}` : "-"}</td>
                  <td>
                    <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td>
                    {shortDate(r.archivedAt)}
                    <span className="cell-sub">by {r.archivedByName || "unknown"}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline"
                      disabled={busyId === r._id}
                      onClick={() => handleRestore(r)}
                    >
                      {busyId === r._id ? "Restoring..." : "Restore"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ---------- Tab 2: archived user accounts (Admin only) ----------
function ArchivedUsers() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError("");

    getArchivedUsers(search)
      .then((data) => setRecords(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, refreshKey]);

  const handleRestore = async (u) => {
    const question = `Restore ${u.fullName}'s account to Manage Users? It will stay inactive until you activate it.`;
    if (!window.confirm(question)) return;

    setError("");
    setMessage("");
    setBusyId(u._id);
    try {
      await restoreUser(u._id);
      setMessage(`${u.fullName}'s account was restored to Manage Users (still inactive).`);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-group">
          <input
            type="search"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="muted">Showing {records.length} archived account(s)</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <p className="muted">Loading archive...</p>
      ) : records.length === 0 ? (
        <p className="muted">No archived accounts found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Archived</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((u) => (
                <tr key={u._id}>
                  <td>{u.fullName}</td>
                  <td>
                    {u.email}
                    <span className="cell-sub">{u.phone}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                  </td>
                  <td>{shortDate(u.createdAt)}</td>
                  <td>
                    {shortDate(u.archivedAt)}
                    <span className="cell-sub">by {u.archivedByName || "unknown"}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline"
                      disabled={busyId === u._id}
                      onClick={() => handleRestore(u)}
                    >
                      {busyId === u._id ? "Restoring..." : "Restore"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default ArchivePage;
