// api/reservationApi.js
// Functions for the /api/reservations endpoints.

import { apiRequest } from "./apiClient";

// GET /api/reservations/slots?date=...&guests=...
// Returns the 5 time slots: [{ time, available, tablesLeft, reason }, ...]
export async function getSlotAvailability(date, guests) {
  const params = new URLSearchParams({ date, guests: String(guests) });
  const result = await apiRequest(`/reservations/slots?${params.toString()}`);
  return result.data;
}

// POST /api/reservations -> creates a booking (table assigned automatically)
// data = { customerName, customerEmail, customerPhone, date, time, guests, specialRequest }
export async function createReservation(data) {
  const result = await apiRequest("/reservations", { method: "POST", body: data });
  return result.data;
}
// GET /api/reservations/my -> the logged-in customer's reservations (newest first)
export async function getMyReservations() {
  const result = await apiRequest("/reservations/my");
  return result.data;
}

// PATCH /api/reservations/:id/cancel -> the customer cancels their OWN reservation
export async function cancelMyReservation(id, reason) {
  const result = await apiRequest(`/reservations/${id}/cancel`, {
    method: "PATCH",
    body: { reason },
  });
  return result.data;
}

// GET /api/reservations (Staff/Admin) -> all reservations, sorted by date and time
// filters = { status, date }
export async function getReservations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.date) params.append("date", filters.date);

  const query = params.toString() ? `?${params.toString()}` : "";
  const result = await apiRequest(`/reservations${query}`);
  return result.data;
}

// PATCH /api/reservations/:id/status (Staff/Admin)
// status = "Confirmed" | "Cancelled" | "Completed"; reason is optional (used for Cancelled)
export async function changeReservationStatus(id, status, reason) {
  const body = reason ? { status, reason } : { status };
  const result = await apiRequest(`/reservations/${id}/status`, { method: "PATCH", body });
  return result.data;
}

// GET /api/reservations/availability -> free tables for a date + time + party size
// excludeId (optional) = the reservation being edited, so its own table still counts as free
export async function getAvailableTables(date, time, guests, excludeId) {
  const params = new URLSearchParams({ date, time, guests: String(guests) });
  if (excludeId) params.append("exclude", excludeId);

  const result = await apiRequest(`/reservations/availability?${params.toString()}`);
  return result.data;
}

// PUT /api/reservations/:id (Staff/Admin) -> edit date, time, guests, table, details
export async function updateReservation(id, changes) {
  const result = await apiRequest(`/reservations/${id}`, { method: "PUT", body: changes });
  return result.data;
}

