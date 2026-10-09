// api/tableApi.js
// Functions for the /api/tables endpoints. Pages call these instead of using fetch directly.

import { apiRequest } from "./apiClient";

// GET /api/tables  (optional filters: { status, minCapacity })
// Returns an array of tables.
export async function getTables(filters = {}) {
  // Build the "?status=available&minCapacity=4" part of the URL
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.minCapacity) params.append("minCapacity", filters.minCapacity);

  const query = params.toString() ? `?${params.toString()}` : "";
  const result = await apiRequest(`/tables${query}`);
  return result.data;
}

// PUT /api/tables/:id
// changes example: { status: "unavailable" }
// Returns the updated table.
export async function updateTable(id, changes) {
  const result = await apiRequest(`/tables/${id}`, { method: "PUT", body: changes });
  return result.data;
}

// POST /api/tables (Staff/Admin) -> adds a new table. Returns the new table.
// data = { tableNumber, capacity, location, status }
export async function createTable(data) {
  const result = await apiRequest("/tables", { method: "POST", body: data });
  return result.data;
}
