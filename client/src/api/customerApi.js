// api/customerApi.js
// Functions for the /api/customers endpoints (Staff/Admin, view only).

import { apiRequest } from "./apiClient";

// GET /api/customers  (optional filters: { search, status })
// Returns customers, each with a "bookings" summary.
export async function getCustomers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.status) params.append("status", filters.status);

  const query = params.toString() ? `?${params.toString()}` : "";
  const result = await apiRequest(`/customers${query}`);
  return result.data;
}

// GET /api/customers/:id -> one customer + their booking history
export async function getCustomerById(id) {
  const result = await apiRequest(`/customers/${id}`);
  return result.data;
}
