// main.jsx
// Starting point of the React app. It puts <App /> inside the
// HTML element with id="root" (see index.html).

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* BrowserRouter turns on page navigation using the URL */}
    <BrowserRouter>
      {/* AuthProvider shares the logged-in user with every component */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
