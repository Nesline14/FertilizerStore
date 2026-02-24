import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../authContext";

const API_BASE = "/api";

export default function RegisterPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
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
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.message || "Failed to register");
    } else {
      login(data.token, data.user);
      navigate("/");
    }
  };

  return (
    <div className="stack" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="card stack">
        <div className="section-title">Register</div>
        <div className="section-subtitle">
          Create a customer account to place orders and manage your profile.
        </div>
        {message && (
          <div style={{ fontSize: "0.85rem", color: "#92400e" }}>
            {message}
          </div>
        )}
        <form className="stack" onSubmit={handleSubmit}>
          <div>
            <div className="input-label">Full Name</div>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

