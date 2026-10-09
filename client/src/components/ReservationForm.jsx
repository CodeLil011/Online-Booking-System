// components/ReservationForm.jsx
// Staff/Admin form (shown in a Modal) for:
//   reservation = null   -> NEW phone/walk-in booking (table can be auto-assigned)
//   reservation = {...}  -> EDIT an existing reservation (pre-filled; a table must be chosen)
// The table list only shows tables that are FREE for the chosen date, time, and guests.

import { useEffect, useState } from "react";
import { getAvailableTables } from "../api/reservationApi";
import { getTodayString, addDaysString, formatTime } from "../utils/dateHelpers";

const TIME_SLOTS = ["11:00", "13:00", "15:00", "17:00", "19:00"]; // same as the backend rules
const GUEST_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1); // [1, 2, ..., 10]
const BOOKING_WINDOW_DAYS = 30;

function ReservationForm({ reservation, onSave, onCancel }) {
  const isEdit = Boolean(reservation);

  // Start with the reservation's values (Edit) or defaults (New)
  const [form, setForm] = useState({
    customerName: reservation ? reservation.customerName : "",
    customerEmail: reservation ? reservation.customerEmail : "",
    customerPhone: reservation ? reservation.customerPhone : "",
    date: reservation ? reservation.date : getTodayString(),
    time: reservation ? reservation.time : "19:00",
    guests: reservation ? reservation.guests : 2,
    table: reservation && reservation.table ? reservation.table._id : "", // "" = auto-assign
    specialRequest: reservation ? reservation.specialRequest : "",
  });

  const [tableOptions, setTableOptions] = useState([]); // free tables
  const [tablesError, setTablesError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const excludeId = reservation ? reservation._id : null;

  // Reload the FREE tables whenever date, time, or guests change
  useEffect(() => {
    setTablesError("");

    getAvailableTables(form.date, form.time, form.guests, excludeId)
      .then((tables) => {
        setTableOptions(tables);
        // If the chosen table is no longer free or big enough, clear the choice
        setForm((current) =>
          current.table && !tables.some((t) => t._id === current.table)
            ? { ...current, table: "" }
            : current
        );
      })
      .catch((err) => {
        setTableOptions([]);
        setTablesError(err.message); // e.g. "this time slot has already passed today"
      });
  }, [form.date, form.time, form.guests, excludeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "guests" ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isEdit && !form.table) {
      setError("Please choose a table.");
      return;
    }

    const data = { ...form };
    if (!data.table) delete data.table; // new booking without a table -> server auto-assigns

    setSaving(true);
    try {
      await onSave(data); // the page calls the API; the modal closes if it succeeds
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="rf-name">Customer Name</label>
        <input
          id="rf-name"
          name="customerName"
          value={form.customerName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="rf-email">Email</label>
          <input
            id="rf-email"
            name="customerEmail"
            type="email"
            value={form.customerEmail}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="rf-phone">Phone</label>
          <input
            id="rf-phone"
            name="customerPhone"
            type="tel"
            placeholder="09171234567"
            value={form.customerPhone}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="rf-date">Date</label>
          <input
            id="rf-date"
            name="date"
            type="date"
            min={getTodayString()}
            max={addDaysString(BOOKING_WINDOW_DAYS)}
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="rf-time">Time</label>
          <select id="rf-time" name="time" value={form.time} onChange={handleChange}>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {formatTime(slot)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="rf-guests">Guests</label>
          <select id="rf-guests" name="guests" value={form.guests} onChange={handleChange}>
            {GUEST_OPTIONS.map((number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="rf-table">Table</label>
          <select id="rf-table" name="table" value={form.table} onChange={handleChange}>
            {isEdit ? (
              <option value="">Choose a table...</option>
            ) : (
              <option value="">Auto-assign (smallest free table)</option>
            )}
            {tableOptions.map((t) => (
              <option key={t._id} value={t._id}>
                Table {t.tableNumber} · {t.capacity} seats · {t.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Explain why the table list may be empty */}
      {tablesError && <span className="form-hint">⚠ {tablesError}</span>}
      {!tablesError && tableOptions.length === 0 && (
        <span className="form-hint">⚠ No tables are free for this date, time, and party size.</span>
      )}

      <div className="form-group">
        <label htmlFor="rf-request">Special Request</label>
        <textarea
          id="rf-request"
          name="specialRequest"
          maxLength={300}
          value={form.specialRequest}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Booking"}
        </button>
      </div>
    </form>
  );
}

export default ReservationForm;
