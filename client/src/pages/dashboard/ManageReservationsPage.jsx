// pages/dashboard/ManageReservationsPage.jsx
// Staff/Admin: view all reservations and move them through the workflow:
//   Pending -> Confirmed -> Completed     (or Cancelled: rejected / cancelled / no-show)
// Also: edit reservations and create phone/walk-in bookings.

import { useEffect, useState } from "react";
import {
  getReservations,
  changeReservationStatus,
  createReservation,
  updateReservation,
} from "../../api/reservationApi";
import { formatDate, formatTime, getTodayString, getNowString } from "../../utils/dateHelpers";
import Modal from "../../components/Modal";
import ReservationForm from "../../components/ReservationForm";

function ManageReservationsPage() {
  // ----- List + filters -----
  const [reservations, setReservations] = useState([]);
  const [view, setView] = useState("upcoming"); // upcoming | today | past | all
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyId, setBusyId] = useState(null); // reservation being updated

  // ----- Reason pop-up (Reject / Cancel / No-show) -----
  const [toCancel, setToCancel] = useState(null); // { reservation, action }
  const [reason, setReason] = useState("");
  const [modalError, setModalError] = useState("");
  const [savingCancel, setSavingCancel] = useState(false);

  // ----- Booking form pop-up (New booking / Edit) -----
  // null = closed, { mode: "add" } or { mode: "edit", reservation }
  const [formModal, setFormModal] = useState(null);

  const reload = () => setRefreshKey((key) => key + 1);

  // Load reservations (status filter is done by the backend)
  useEffect(() => {
    setLoading(true);
    setError("");

    getReservations({ status: statusFilter })
      .then((data) => setReservations(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, refreshKey]);

  // ----- Helpers -----
  const today = getTodayString();
  const now = getNowString();
  const hasStarted = (r) => `${r.date} ${r.time}` <= now;

  // View + search filters are done here in the browser
  const text = search.trim().toLowerCase();
  const shown = reservations
    .filter((r) => {
      if (view === "today") return r.date === today;
      if (view === "upcoming") return r.date >= today;
      if (view === "past") return r.date < today;
      return true; // "all"
    })
    .filter(
      (r) =>
        !text ||
        r.customerName.toLowerCase().includes(text) ||
        r.customerEmail.includes(text) ||
        r.customerPhone.includes(text) ||
        r._id.toLowerCase() === text
    );

  // The backend sorts oldest first; for "Past", show the most recent first
  if (view === "past") shown.reverse();

  const pendingCount = reservations.filter(
    (r) => r.status === "Pending" && !hasStarted(r)
  ).length;

  // ----- Confirm / Complete (one click + "Are you sure?") -----
  const quickStatusChange = async (r, status, question) => {
    if (!window.confirm(question)) return;

    setError("");
    setMessage("");
    setBusyId(r._id);
    try {
      await changeReservationStatus(r._id, status);
      setMessage(`${r.customerName}'s reservation (${r._id}) is now ${status}.`);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirm = (r) =>
    quickStatusChange(
      r,
      "Confirmed",
      `Confirm ${r.customerName}'s reservation on ${formatDate(r.date)} at ${formatTime(r.time)}?`
    );

  const handleComplete = (r) =>
    quickStatusChange(
      r,
      "Completed",
      `Mark ${r.customerName}'s reservation as completed? (The guests have dined.)`
    );

  // ----- Reject / Cancel / No-show (pop-up with a reason) -----
  const openCancel = (r, action) => {
    setToCancel({ reservation: r, action });
    setReason(action === "No-show" ? "Customer did not arrive (no-show)" : "");
    setModalError("");
    setMessage("");
  };

  const handleCancelSubmit = async () => {
    const r = toCancel.reservation;
    setModalError("");
    setSavingCancel(true);
    try {
      await changeReservationStatus(r._id, "Cancelled", reason);
      setMessage(`${r.customerName}'s reservation (${r._id}) was cancelled (${toCancel.action}).`);
      setToCancel(null);
      reload();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSavingCancel(false);
    }
  };

  // ----- New booking / Edit (called by ReservationForm) -----
  // If the API fails, the error goes back to ReservationForm and is shown inside the form.
  const handleSaveReservation = async (data) => {
    if (formModal.mode === "add") {
      const created = await createReservation(data);
      setMessage(
        `Booking for ${created.customerName} created: ${formatDate(created.date)} at ${formatTime(created.time)}, Table ${created.table.tableNumber} (Pending).`
      );
    } else {
      const updated = await updateReservation(formModal.reservation._id, data);
      setMessage(`Reservation ${updated._id} (${updated.customerName}) was updated.`);
    }

    setError("");
    setFormModal(null);
    reload();
  };

  // Which buttons each row gets (follows the workflow rules)
  const renderActions = (r) => {
    const started = hasStarted(r);
    const busy = busyId === r._id;

    // Edit is allowed for active reservations that haven't started
    const editButton = (
      <button
        className="btn btn-outline"
        disabled={busy}
        onClick={() => {
          setMessage("");
          setFormModal({ mode: "edit", reservation: r });
        }}
      >
        Edit
      </button>
    );

    if (r.status === "Pending") {
      return (
        <>
          {!started && (
            <button className="btn" disabled={busy} onClick={() => handleConfirm(r)}>
              Confirm
            </button>
          )}
          {!started && editButton}
          <button className="btn btn-danger" disabled={busy} onClick={() => openCancel(r, "Reject")}>
            Reject
          </button>
        </>
      );
    }

    if (r.status === "Confirmed") {
      return started ? (
        <>
          <button className="btn" disabled={busy} onClick={() => handleComplete(r)}>
            Complete
          </button>
          <button
            className="btn btn-danger"
            disabled={busy}
            onClick={() => openCancel(r, "No-show")}
          >
            No-show
          </button>
        </>
      ) : (
        <>
          {editButton}
          <button className="btn btn-danger" disabled={busy} onClick={() => openCancel(r, "Cancel")}>
            Cancel
          </button>
        </>
      );
    }

    return <span className="muted">No actions</span>; // Completed or Cancelled (final)
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Manage Reservations</h1>
          <p className="muted">Confirm, edit, reject, and complete customer reservations.</p>
        </div>
        <button
          className="btn"
          onClick={() => {
            setMessage("");
            setFormModal({ mode: "add" });
          }}
        >
          + New Booking
        </button>
      </div>

      {pendingCount > 0 && (
        <div className="alert alert-info">
          {pendingCount} pending reservation(s) waiting for confirmation.
        </div>
      )}

      {/* Search + filters */}
      <div className="toolbar">
        <div className="toolbar-group">
          <input
            type="search"
            placeholder="Search name, email, phone, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label>
            View:{" "}
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="upcoming">Upcoming</option>
              <option value="today">Today</option>
              <option value="past">Past</option>
              <option value="all">All</option>
            </select>
          </label>

          <label>
            Status:{" "}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
        </div>

        <span className="muted">Showing {shown.length} reservation(s)</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* Reservation list */}
      {loading ? (
        <p className="muted">Loading reservations...</p>
      ) : shown.length === 0 ? (
        <p className="muted">No reservations found.</p>
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
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r._id}>
                  <td>
                    {formatDate(r.date)}
                    <span className="cell-sub">
                      {formatTime(r.time)} · Ref {r._id}
                    </span>
                  </td>
                  <td>
                    {r.customerName}
                    <span className="cell-sub">{r.customerPhone}</span>
                    <span className="cell-sub">{r.customerEmail}</span>
                    {!r.customer && <span className="cell-sub">(phone/walk-in booking)</span>}
                  </td>
                  <td>{r.guests}</td>
                  <td>{r.table ? `Table ${r.table.tableNumber}` : "-"}</td>
                  <td>
                    <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td className="notes-cell">
                    {r.specialRequest}
                    {r.status === "Cancelled" && (
                      <span className="cell-sub">
                        Cancelled by {r.cancelledBy}
                        {r.cancellationReason && `: ${r.cancellationReason}`}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="actions">{renderActions(r)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reason pop-up for Reject / Cancel / No-show */}
      {toCancel && (
        <Modal title={`${toCancel.action} Reservation`} onClose={() => setToCancel(null)}>
          <p>
            <strong>{toCancel.reservation.customerName}</strong>,{" "}
            {formatDate(toCancel.reservation.date)} at {formatTime(toCancel.reservation.time)},{" "}
            {toCancel.reservation.guests} guest(s)
          </p>
          <p className="muted">
            The reservation will be marked as Cancelled. The customer will see the reason.
          </p>

          {modalError && <div className="alert alert-error">{modalError}</div>}

          <div className="form form-group">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              maxLength={200}
              placeholder="e.g. Fully booked for a private event"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setToCancel(null)}>
              Back
            </button>
            <button className="btn btn-danger" onClick={handleCancelSubmit} disabled={savingCancel}>
              {savingCancel ? "Saving..." : `${toCancel.action} Reservation`}
            </button>
          </div>
        </Modal>
      )}

      {/* New booking / Edit pop-up */}
      {formModal && (
        <Modal
          title={
            formModal.mode === "add"
              ? "New Booking (phone / walk-in)"
              : `Edit Reservation (${formModal.reservation._id})`
          }
          onClose={() => setFormModal(null)}
        >
          <ReservationForm
            reservation={formModal.mode === "edit" ? formModal.reservation : null}
            onSave={handleSaveReservation}
            onCancel={() => setFormModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

export default ManageReservationsPage;
