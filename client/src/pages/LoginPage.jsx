import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../authContext";

const API_BASE = "/api";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.message || "Failed to login");
    } else {
      login(data.token, data.user);
      navigate("/");
    }
  };

  return (
    <div className="stack" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="card stack">
        <div className="section-title">Login</div>
        <div className="section-subtitle">
          Sign in to purchase fertilizers, manage your cart, and view orders.
        </div>
        {message && (
          <div style={{ fontSize: "0.85rem", color: "#92400e" }}>
            {message}
          </div>
        )}
        <form className="stack" onSubmit={handleSubmit}>
          <div>
            <div className="input-label">Email</div>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="input-label">Password</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
          <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
            Demo accounts:
            <br />
            Admin – email: <code>admin@fertistore.local</code>, password:{" "}
            <code>admin123</code>
            <br />
            Customer – email: <code>john@farm.local</code>, password:{" "}
            <code>customer123</code>
          </div>
        </form>
      </div>
    </div>
  );
}

