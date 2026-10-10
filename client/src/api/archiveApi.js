// api/archiveApi.js
// Functions for the /api/archive endpoints (Staff/Admin).

import { apiRequest } from "./apiClient";

// GET /api/archive/reservations (optional search) -> archived reservations
export async function getArchivedReservations(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const result = await apiRequest(`/archive/reservations${query}`);
  return result.data;
}

// PATCH /api/archive/reservations/:id/archive -> move a finished reservation to the archive
export async function archiveReservation(id) {
  const result = await apiRequest(`/archive/reservations/${id}/archive`, { method: "PATCH" });
  return result.data;
}

// PATCH /api/archive/reservations/:id/restore -> bring it back to the main list
export async function restoreReservation(id) {
  const result = await apiRequest(`/archive/reservations/${id}/restore`, { method: "PATCH" });
  return result.data;
}


// ----- User accounts (Admin only) -----

// GET /api/archive/users (optional search) -> archived accounts
export async function getArchivedUsers(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const result = await apiRequest(`/archive/users${query}`);
  return result.data;
}

// PATCH /api/archive/users/:id/archive -> move a deactivated account to the archive
export async function archiveUser(id) {
  const result = await apiRequest(`/archive/users/${id}/archive`, { method: "PATCH" });
  return result.data;
}

// PATCH /api/archive/users/:id/restore -> bring it back to Manage Users (still inactive)
export async function restoreUser(id) {
  const result = await apiRequest(`/archive/users/${id}/restore`, { method: "PATCH" });
  return result.data;
}
