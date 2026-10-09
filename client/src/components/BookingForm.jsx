// components/BookingForm.jsx
// The customer booking form (Book Now section of the home page).
// 1. Customer picks date + guests -> the 5 time slots load from the backend
// 2. Full or past slots are disabled
// 3. Customer picks a slot, adds special requests, and submits
// 4. The backend assigns a table automatically and returns the reservation

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getSlotAvailability, createReservation } from "../api/reservationApi";
import { getTodayString, addDaysString, formatTime, formatDate } from "../utils/dateHelpers";

const BOOKING_WINDOW_DAYS = 30; // same rule as the backend
const GUEST_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1); // [1, 2, ..., 10]

function BookingForm() {
  const { user } = useAuth();
  const isCustomer = user?.role === "customer"; // ?. = "if user exists"

  // ----- Form values -----
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    date: getTodayString(),
    guests: 2,
    time: "", // chosen time slot, e.g. "19:00"
    specialRequest: "",
  });

  // Pre-fill contact details from the logged-in user's profile
  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        customerName: user.fullName,
        customerEmail: user.email,
        customerPhone: user.phone,
      }));
    }
  }, [user]);

  // ----- Time slots -----
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [slotsRefresh, setSlotsRefresh] = useState(0); // change it to reload the slots

  // Load the slots whenever the date or number of guests changes
  useEffect(() => {
    setSlotsLoading(true);
    setSlotsError("");

    getSlotAvailability(form.date, form.guests)
      .then((data) => {
        setSlots(data);
        // If the chosen slot is no longer available, un-select it
        setForm((current) => {
          const chosen = data.find((slot) => slot.time === current.time);
          return chosen && chosen.available ? current : { ...current, time: "" };
        });
      })
      .catch((err) => {
        setSlots([]);
        setSlotsError(err.message);
      })
      .finally(() => setSlotsLoading(false));
  }, [form.date, form.guests, slotsRefresh]);

  // ----- Submitting -----
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(null); // the reservation that was just created

  const handleChange = (e) => {
    const { name, value } = e.target;
    // "guests" must be a number (select boxes give text)
    setForm({ ...form, [name]: name === "guests" ? Number(value) : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.time) {
      setError("Please choose a time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const reservation = await createReservation(form);
      setBooked(reservation); // show the success screen
    } catch (err) {
      setError(err.message);
      // Someone may have just taken the last table: refresh the slots
      setSlotsRefresh((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setBooked(null);
    setForm((current) => ({ ...current, time: "", specialRequest: "" }));
    setSlotsRefresh((n) => n + 1);
  };

  // ===================== Success screen =====================
  if (booked) {
    return (
      <div className="booking-success">
        <h3>Reservation submitted!</h3>
        <p>
          <strong>{formatDate(booked.date)}</strong> at <strong>{formatTime(booked.time)}</strong>
        </p>
        <p>
          {booked.guests} guest(s) · Table {booked.table.tableNumber} ({booked.table.location})
        </p>
        <p className="muted">
          Status: <span className="badge badge-pending">Pending</span> The restaurant will
          confirm your reservation soon.
        </p>
        <div className="actions">
          <Link to="/my-reservations" className="btn">
            View My Reservations
          </Link>
          <button type="button" className="btn btn-outline" onClick={handleBookAnother}>
            Make Another Booking
          </button>
        </div>
      </div>
    );
  }

  // ===================== Booking form =====================
  return (
    <form className="form booking-form" onSubmit={handleSubmit}>
      {/* Contact details (pre-filled for logged-in customers) */}
      <div className="form-group">
        <label htmlFor="customerName">Full Name</label>
        <input
          id="customerName"
          name="customerName"
          placeholder="Enter your name here"
          value={form.customerName}
          onChange={handleChange}
          disabled={!isCustomer}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="customerEmail">Email</label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            placeholder="you@email.com"
            value={form.customerEmail}
            onChange={handleChange}
            disabled={!isCustomer}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="customerPhone">Phone</label>
          <input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            placeholder="09171234567"
            value={form.customerPhone}
            onChange={handleChange}
            disabled={!isCustomer}
            required
          />
        </div>
      </div>

      {/* Date + guests (anyone can use these to check availability) */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            min={getTodayString()}
            max={addDaysString(BOOKING_WINDOW_DAYS)}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="guests">Guests</label>
          <select id="guests" name="guests" value={form.guests} onChange={handleChange}>
            {GUEST_OPTIONS.map((number) => (
              <option key={number} value={number}>
                {number} {number === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Time slot buttons */}
      <div className="form-group">
        <label>Time Slot</label>
        {slotsError && <div className="alert alert-error">{slotsError}</div>}
        {slotsLoading && slots.length === 0 ? (
          <p className="muted">Checking available times...</p>
        ) : (
          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button" // so clicking a slot does NOT submit the form
                className={`slot-btn${form.time === slot.time ? " selected" : ""}`}
                disabled={!slot.available}
                title={slot.reason}
                onClick={() => setForm({ ...form, time: slot.time })}
              >
                {formatTime(slot.time)}
                <small>{slot.available ? "Available" : slot.reason}</small>
              </button>
            ))}
          </div>
        )}
        <span className="form-hint">Each seating is 2 hours. Your table is assigned automatically.</span>
      </div>

      {/* Special requests */}
      <div className="form-group">
        <label htmlFor="specialRequest">Special Requests (optional)</label>
        <textarea
          id="specialRequest"
          name="specialRequest"
          placeholder="e.g. Birthday celebration, window seat, high chair"
          maxLength={300}
          value={form.specialRequest}
          onChange={handleChange}
          disabled={!isCustomer}
        />
        <span className="form-hint char-count">{form.specialRequest.length}/300</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Bottom: submit (customers), login prompt (visitors), or a note (staff/admin) */}
      {isCustomer ? (
        <button type="submit" className="btn btn-block" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Reservation"}
        </button>
      ) : !user ? (
        <div className="login-prompt">
          <p>Please log in or create an account to book a table.</p>
          <div className="actions">
            {/* state.from tells the Login page to bring them back here afterwards */}
            <Link to="/login" state={{ from: "/#book" }} className="btn">
              Log in to Book
            </Link>
            <Link to="/register" className="btn btn-outline">
              Create an Account
            </Link>
          </div>
        </div>
      ) : (
        <div className="login-prompt">
          <p>
            You are logged in as <strong>{user.role}</strong>. Online bookings are made from
            customer accounts. Manage reservations in the dashboard.
          </p>
        </div>
      )}
    </form>
  );
}

export default BookingForm;
