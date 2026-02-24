import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "fertistore_auth";

export function AuthContextProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setToken(parsed.token);
        setUser(parsed.user);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (token && user) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token, user })
      );
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [token, user]);

  const login = (tokenValue, userValue) => {
    setToken(tokenValue);
    setUser(userValue);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const authFetch = async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      logout();
    }
    return response;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

