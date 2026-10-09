// pages/dashboard/ManageTablesPage.jsx
// Staff/Admin: manage restaurant tables and see the daily table schedule.
//   Tab 1 "Tables":         add, edit, take in/out of service (manual)
//   Tab 2 "Daily Schedule": which table is booked in each seating (automatic, from reservations)

import { useEffect, useState } from "react";
import { getTables, createTable, updateTable } from "../../api/tableApi";
import { getReservations } from "../../api/reservationApi";
import { formatTime, getTodayString } from "../../utils/dateHelpers";
import Modal from "../../components/Modal";
import TableForm from "../../components/TableForm";

const TIME_SLOTS = ["11:00", "13:00", "15:00", "17:00", "19:00"]; // same as the backend rules
const ACTIVE_STATUSES = ["Pending", "Confirmed"];

// What staff see instead of the backend's "available"/"unavailable"
const STATUS_LABELS = {
  available: "In Service",
  unavailable: "Out of Service",
};

function ManageTablesPage() {
  const [tab, setTab] = useState("tables"); // "tables" or "schedule"

  // ----- Data -----
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState(null);

  // ----- Filters / pop-up -----
  const [statusFilter, setStatusFilter] = useState("");
  const [scheduleDate, setScheduleDate] = useState(getTodayString());
  const [formModal, setFormModal] = useState(null); // null, { mode: "add" }, { mode: "edit", table }

  const reload = () => setRefreshKey((key) => key + 1);

  // Load tables AND reservations at the same time
  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([getTables(), getReservations()])
      .then(([tableData, reservationData]) => {
        setTables(tableData);
        setReservations(reservationData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // ----- Helpers -----
  const today = getTodayString();
  const sortedTables = [...tables].sort((a, b) => a.tableNumber - b.tableNumber);
  const shownTables = sortedTables.filter((t) => !statusFilter || t.status === statusFilter);
  const inServiceCount = tables.filter((t) => t.status === "available").length;

  // Upcoming active (Pending/Confirmed) bookings on a table
  const upcomingFor = (tableId) =>
    reservations.filter(
      (r) =>
        r.table &&
        r.table._id === tableId &&
        ACTIVE_STATUSES.includes(r.status) &&
        r.date >= today
    );

  // The booking on a table at the chosen schedule date + time (cancelled ones don't count)
  const bookingAt = (tableId, time) =>
    reservations.find(
      (r) =>
        r.table &&
        r.table._id === tableId &&
        r.date === scheduleDate &&
        r.time === time &&
        r.status !== "Cancelled"
    );

  // ----- Take in / out of service -----
  const handleToggleStatus = async (table) => {
    const goingOut = table.status === "available";
    let question = goingOut
      ? `Take Table ${table.tableNumber} out of service? Customers will not be able to book it.`
      : `Put Table ${table.tableNumber} back in service?`;

    const upcoming = upcomingFor(table._id);
    if (goingOut && upcoming.length > 0) {
      question +=
        `\n\nWarning: this table still has ${upcoming.length} upcoming reservation(s). ` +
        "They will keep this table. Use Manage Reservations → Edit to move them.";
    }

    if (!window.confirm(question)) return;

    setError("");
    setMessage("");
    setBusyId(table._id);
    try {
      const updated = await updateTable(table._id, {
        status: goingOut ? "unavailable" : "available",
      });
      setMessage(`Table ${updated.tableNumber} is now ${STATUS_LABELS[updated.status]}.`);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ----- Add / Edit (called by TableForm; errors show inside the form) -----
  const handleSaveTable = async (data) => {
    if (formModal.mode === "add") {
      const created = await createTable(data);
      setMessage(`Table ${created.tableNumber} was added.`);
    } else {
      const updated = await updateTable(formModal.table._id, data);
      setMessage(`Table ${updated.tableNumber} was updated.`);
    }

    setError("");
    setFormModal(null);
    reload();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manage Tables</h1>
          <p className="muted">
            Manage restaurant tables and see which tables are booked each day.
          </p>
        </div>
        {tab === "tables" && (
          <button
            className="btn"
            onClick={() => {
              setMessage("");
              setFormModal({ mode: "add" });
            }}
          >
            + Add Table
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab${tab === "tables" ? " active" : ""}`}
          onClick={() => setTab("tables")}
        >
          Tables
        </button>
        <button
          className={`tab${tab === "schedule" ? " active" : ""}`}
          onClick={() => setTab("schedule")}
        >
          Daily Schedule
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <p className="muted">Loading tables...</p>
      ) : tab === "tables" ? (
        /* ===================== TAB 1: TABLES ===================== */
        <>
          <div className="toolbar">
            <label>
              Status:{" "}
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="available">In Service</option>
                <option value="unavailable">Out of Service</option>
              </select>
            </label>
            <span className="muted">
              Showing {shownTables.length} table(s) · {inServiceCount} in service
            </span>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Upcoming Bookings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shownTables.map((table) => (
                  <tr key={table._id}>
                    <td>Table {table.tableNumber}</td>
                    <td>{table.capacity} seats</td>
                    <td>{table.location}</td>
                    <td>
                      <span className={`badge badge-${table.status}`}>
                        {STATUS_LABELS[table.status]}
                      </span>
                    </td>
                    <td>{upcomingFor(table._id).length}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-outline"
                          disabled={busyId === table._id}
                          onClick={() => {
                            setMessage("");
                            setFormModal({ mode: "edit", table });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className={table.status === "available" ? "btn btn-danger" : "btn"}
                          disabled={busyId === table._id}
                          onClick={() => handleToggleStatus(table)}
                        >
                          {table.status === "available"
                            ? "Take Out of Service"
                            : "Put Back in Service"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* ===================== TAB 2: DAILY SCHEDULE ===================== */
        <>
          <div className="toolbar">
            <label>
              Date:{" "}
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </label>
            <div className="legend">
              <span className="legend-item slot-pending">Pending</span>
              <span className="legend-item slot-confirmed">Confirmed</span>
              <span className="legend-item slot-completed">Completed</span>
              <span className="legend-item slot-free">Free</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table schedule-table">
              <thead>
                <tr>
                  <th>Table</th>
                  {TIME_SLOTS.map((time) => (
                    <th key={time}>{formatTime(time)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTables.map((table) => (
                  <tr key={table._id} className={table.status === "unavailable" ? "row-out" : ""}>
                    <td>
                      Table {table.tableNumber}
                      <span className="cell-sub">
                        {table.capacity} seats · {table.location}
                      </span>
                      {table.status === "unavailable" && (
                        <span className="cell-sub">Out of Service</span>
                      )}
                    </td>

                    {/* One cell per time slot: who is booked there, or "Free" */}
                    {TIME_SLOTS.map((time) => {
                      const booking = bookingAt(table._id, time);
                      return booking ? (
                        <td
                          key={time}
                          className={`slot-cell slot-${booking.status.toLowerCase()}`}
                        >
                          {booking.customerName}
                          <span className="cell-sub">
                            {booking.guests} guests · {booking.status}
                          </span>
                        </td>
                      ) : (
                        <td key={time} className="slot-cell slot-free">
                          Free
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add / Edit table pop-up */}
      {formModal && (
        <Modal
          title={
            formModal.mode === "add" ? "Add Table" : `Edit Table ${formModal.table.tableNumber}`
          }
          onClose={() => setFormModal(null)}
        >
          <TableForm
            table={formModal.mode === "edit" ? formModal.table : null}
            onSave={handleSaveTable}
            onCancel={() => setFormModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

export default ManageTablesPage;
