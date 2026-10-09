// api/apiClient.js
// ONE place for talking to the backend. Every API file uses apiRequest().
// - Builds the full URL
// - Sends JSON when there is a body
// - Adds the login token automatically (if the user is logged in)
// - Turns backend errors ({ success: false, message }) into JavaScript errors

export const API_URL = "http://localhost:5000/api";

// ----- Token storage -----
// localStorage is the browser's small storage space. It keeps the token
// even after the page is refreshed, so the user stays logged in.
const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// ----- The request function -----
export async function apiRequest(path, options = {}) {
  const { method = "GET", body } = options;

  // 1. Prepare the headers
  const headers = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`; // the "wristband" from Step 12
  }

  // 2. Send the request
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined, // JS object -> JSON text
    });
  } catch {
    // fetch only fails like this when the server cannot be reached at all
    throw new Error("Cannot connect to the server. Is the backend running?");
  }

  // 3. Read the JSON reply (use an empty object if the reply is not JSON)
  const data = await response.json().catch(() => ({}));

  // 4. If the backend reports a problem, throw an error with its message.
  //    error.status keeps the HTTP code (e.g. 401) for pages that need it.
  if (!response.ok || data.success === false) {
    const details = Array.isArray(data.errors) ? `: ${data.errors.join(", ")}` : "";
    const error = new Error((data.message || `Request failed (${response.status})`) + details);
    error.status = response.status;
    throw error;
  }

  // 5. Success: return the whole reply
  return data;
}
