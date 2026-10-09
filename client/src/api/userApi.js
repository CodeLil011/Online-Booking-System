// api/userApi.js
// Functions for the /api/users endpoints (Admin only).

import { apiRequest } from "./apiClient";

// GET /api/users  (optional filters: { role, status, search })
// Returns an array of users.
export async function getUsers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.append("role", filters.role);
  if (filters.status) params.append("status", filters.status);
  if (filters.search) params.append("search", filters.search);

  const query = params.toString() ? `?${params.toString()}` : "";
  const result = await apiRequest(`/users${query}`);
  return result.data;
}

// POST /api/users -> creates an account (any role). Returns the new user.
// data = { fullName, email, phone, role, password }
export async function createUserAccount(data) {
  const result = await apiRequest("/users", { method: "POST", body: data });
  return result.data;
}

// PUT /api/users/:id -> edits a user (details, role, or status). Returns the updated user.
// changes example: { status: "inactive" }
export async function updateUserAccount(id, changes) {
  const result = await apiRequest(`/users/${id}`, { method: "PUT", body: changes });
  return result.data;
}
