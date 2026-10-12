// pages/MyReservationsPage.jsx
// Customer: view their own reservations (Upcoming / History) and cancel upcoming ones.
// Uses GET /api/reservations/my and PATCH /api/reservations/:id/cancel (Step 18).

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getMyReservations, cancelMyReservation } from "../api/reservationApi";
import { formatDate, formatTime, getNowString } from "../utils/dateHelpers";
import { formatRef } from "../utils/formatRef";
import Modal from "../components/Modal";

const ACTIVE_STATUSES = ["Pending", "Confirmed"];

// A short message under each card, depending on the status
const STATUS_MESSAGES = {
  Pending: "Waiting for the restaurant to confirm your reservation.",
  Confirmed: "See you soon! Your table is confirmed.",
  Completed: "Thank you for dining with us.",
  Cancelled: "This reservation was cancelled.",
};

function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("upcoming"); // "upcoming" or "history"
  const [refreshKey, setRefreshKey] = useState(0);

  // Cancel pop-up: the reservation being cancelled (null = closed)
  const [toCancel, setToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Load my reservations (on first load and after a cancellation)
  useEffect(() => {
    setLoading(true);
    setError("");

    getMyReservations()
      .then((data) => setReservations(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // ----- Split into Upcoming and History -----
  const now = getNowString();
  // Upcoming = still active (Pending/Confirmed) AND its date + time hasn't arrived yet
  const isUpcoming = (r) => ACTIVE_STATUSES.includes(r.status) && `${r.date} ${r.time}` > now;

  const upcoming = reservations
    .filter(isUpcoming)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)); // soonest first
  const history = reservations.filter((r) => !isUpcoming(r)); // already newest first

  const shown = tab === "upcoming" ? upcoming : history;

  // ----- Cancelling -----
  const openCancel = (reservation) => {
    setToCancel(reservation);
    setCancelReason("");
    setCancelError("");
    setMessage("");
  };

  const handleCancel = async () => {
    setCancelError("");
    setCancelling(true);
    try {
      await cancelMyReservation(toCancel._id, cancelReason);
      setMessage(
        `Your reservation on ${formatDate(toCancel.date)} at ${formatTime(toCancel.time)} was cancelled.`
      );
      setToCancel(null);
      setRefreshKey((key) => key + 1); // reload the list
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  // "2026-10-02T09:15:00.000Z" -> "Oct 2, 2026"
  const formatBookedOn = (isoDate) =>
    new Date(isoDate).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Reservations</h1>
          <p className="muted">View your bookings and cancel upcoming ones if your plans change.</p>
        </div>
        <Link to="/#book" className="btn">
          Book a Table
        </Link>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab${tab === "upcoming" ? " active" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          className={`tab${tab === "history" ? " active" : ""}`}
          onClick={() => setTab("history")}
        >
          History ({history.length})
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* List of reservation cards */}
      {loading ? (
        <p className="muted">Loading your reservations...</p>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <p>
            {tab === "upcoming"
              ? "You have no upcoming reservations."
              : "No past reservations yet."}
          </p>
          {tab === "upcoming" && (
            <Link to="/#book" className="btn">
              Book a Table
            </Link>
          )}
        </div>
      ) : (
        <div className="reservation-list">
          {shown.map((r) => (
            // status-pending / status-confirmed / ... gives the card its colored edge (index.css)
            <article key={r._id} className={`reservation-card status-${r.status.toLowerCase()}`}>
              <div className="reservation-card-header">
                <div>
                  <strong>{formatDate(r.date)}</strong>
                  <span className="muted"> · {formatTime(r.time)}</span>
                </div>
                <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
              </div>

              <dl className="reservation-details">
                <dt>Guests</dt>
                <dd>{r.guests}</dd>

                <dt>Table</dt>
                <dd>
                  {r.table ? `Table ${r.table.tableNumber} · ${r.table.location}` : "To be assigned"}
                </dd>

                {r.specialRequest && (
                  <>
                    <dt>Request</dt>
                    <dd>{r.specialRequest}</dd>
                  </>
                )}

                {r.status === "Cancelled" && (
                  <>
                    <dt>Cancelled by</dt>
                    <dd>
                      {r.cancelledBy === "customer" ? "You" : "The restaurant"}
                      {r.cancellationReason && ` (${r.cancellationReason})`}
                    </dd>
                  </>
                )}
              </dl>

              <p className="muted reservation-meta">
                Ref: {formatRef(r._id)} · Booked on {formatBookedOn(r.createdAt)}
              </p>
              <p className="reservation-status-text">{STATUS_MESSAGES[r.status]}</p>

              {/* Only upcoming reservations can be cancelled */}
              {isUpcoming(r) && (
                <div className="actions">
                  <button className="btn btn-danger" onClick={() => openCancel(r)}>
                    Cancel Reservation
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Cancel pop-up */}
      {toCancel && (
        <Modal title="Cancel Reservation" onClose={() => setToCancel(null)}>
          <p>
            Cancel your reservation on <strong>{formatDate(toCancel.date)}</strong> at{" "}
            <strong>{formatTime(toCancel.time)}</strong> for {toCancel.guests} guest(s)?
          </p>
          <p className="muted">This cannot be undone. You can book again anytime.</p>

          {cancelError && <div className="alert alert-error">{cancelError}</div>}

          <div className="form form-group">
            <label htmlFor="cancelReason">Reason (optional)</label>
            <textarea
              id="cancelReason"
              maxLength={200}
              placeholder="e.g. Change of plans"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setToCancel(null)}>
              Keep Reservation
            </button>
            <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default MyReservationsPage;
