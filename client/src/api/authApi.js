// api/authApi.js
// Functions for the /api/auth endpoints.

import { apiRequest } from "./apiClient";

// POST /api/auth/login -> returns { token, user }
export async function loginUser(email, password) {
  return apiRequest("/auth/login", { method: "POST", body: { email, password } });
}

// POST /api/auth/register -> returns { token, user }
// data = { fullName, email, phone, password }
export async function registerUser(data) {
  return apiRequest("/auth/register", { method: "POST", body: data });
}

// GET /api/auth/me -> returns the logged-in user
export async function getCurrentUser() {
  const result = await apiRequest("/auth/me");
  return result.user;
}

// PUT /api/auth/me -> edit my name/email/phone, returns the updated user
// changes = { fullName, email, phone }
export async function updateMyProfile(changes) {
  const result = await apiRequest("/auth/me", { method: "PUT", body: changes });
  return result.user;
}

// PUT /api/auth/me/password -> change my password
export async function changeMyPassword(currentPassword, newPassword) {
  return apiRequest("/auth/me/password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
}

// POST /api/auth/forgot-password -> asks the server to "email" a reset link
export async function requestPasswordReset(email) {
  return apiRequest("/auth/forgot-password", { method: "POST", body: { email } });
}

// POST /api/auth/reset-password -> sets a new password using the token from the link
export async function resetPassword(token, newPassword) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}
// GET /api/auth/reset-password/:token -> checks if a reset link is still valid
export async function checkResetLink(token) {
  return apiRequest(`/auth/reset-password/${token}`);
}
