// context/AuthContext.jsx
// Shared "login memory" for the whole app.
// Any component can call useAuth() to get: user, loading, login, register, logout, updateUser.

import { createContext, useContext, useEffect, useState } from "react";
import { getToken, saveToken, removeToken } from "../api/apiClient";
import { loginUser, registerUser, getCurrentUser } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // the logged-in user, or null
  const [loading, setLoading] = useState(true); // true while checking a saved token

  // When the website first opens: if a token was saved earlier,
  // ask the backend who it belongs to (GET /api/auth/me).
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((currentUser) => setUser(currentUser))
      .catch((err) => {
        // Token expired, fake, or the account was deactivated: forget it.
        // (If the server is simply offline, keep the token and try again later.)
        if (err.status === 401) removeToken();
      })
      .finally(() => setLoading(false));
  }, []);

  // Log in: get a token from the backend, save it, remember the user
  const login = async (email, password) => {
    const result = await loginUser(email, password);
    saveToken(result.token);
    setUser(result.user);
    return result.user;
  };

  // Register: same as login, because the backend logs new customers in right away
  const register = async (data) => {
    const result = await registerUser(data);
    saveToken(result.token);
    setUser(result.user);
    return result.user;
  };

  // Log out: forget the token and the user ("throw away the wristband")
  const logout = () => {
    removeToken();
    setUser(null);
  };

  // Replace the remembered user after a profile update,
  // so the navbar/sidebar show the new name immediately
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Shortcut so components can write: const { user, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
