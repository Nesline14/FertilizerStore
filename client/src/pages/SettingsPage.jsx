import React, { useEffect, useState } from "react";
import { useAuth } from "../authContext";

const API_BASE = "/api";

export default function SettingsPage() {
  const { user, authFetch, login } = useAuth();
  const [profileName, setProfileName] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [addressForm, setAddressForm] = useState({
    label: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isDefault: true,
  });
  const [editingAddress, setEditingAddress] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    label: "",
    cardLast4: "",
    provider: "",
    isDefault: true,
  });
  const [editingPayment, setEditingPayment] = useState(null);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    const res = await authFetch(`${API_BASE}/users/me`);
    const data = await res.json();
    if (res.ok) {
      setProfileName(data.user.name);
      setAddresses(data.addresses || []);
      setPaymentMethods(data.paymentMethods || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return <div className="card">Please login to manage your settings.</div>;
  }

  const saveProfile = async (e) => {
    e.preventDefault();
    const res = await authFetch(`${API_BASE}/users/me`, {
      method: "PUT",
      body: JSON.stringify({ name: profileName }),
    });
    const data = await res.json();
    if (res.ok) {
      login(localStorage.getItem("fertistore_auth_token") || null, data.user);
      setMessage("Profile updated.");
    } else {
      setMessage(data.message || "Failed to update profile");
    }
  };

  const submitAddress = async (e) => {
    e.preventDefault();
    const payload = addressForm;
    const url = editingAddress
      ? `${API_BASE}/users/me/addresses/${editingAddress.id}`
      : `${API_BASE}/users/me/addresses`;
    const method = editingAddress ? "PUT" : "POST";
    const res = await authFetch(url, {
      method,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Address saved.");
      setAddressForm({
        label: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        isDefault: true,
      });
      setEditingAddress(null);
      loadSettings();
    } else {
      setMessage(data.message || "Failed to save address");
    }
  };

  const deleteAddress = async (id) => {
    const res = await authFetch(`${API_BASE}/users/me/addresses/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadSettings();
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    const payload = paymentForm;
    const url = editingPayment
      ? `${API_BASE}/users/me/payment-methods/${editingPayment.id}`
      : `${API_BASE}/users/me/payment-methods`;
    const method = editingPayment ? "PUT" : "POST";
    const res = await authFetch(url, {
      method,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage("Payment method saved.");
      setPaymentForm({
        label: "",
        cardLast4: "",
        provider: "",
        isDefault: true,
      });
      setEditingPayment(null);
      loadSettings();
    } else {
      setMessage(data.message || "Failed to save payment method");
    }
  };

  const deletePayment = async (id) => {
    const res = await authFetch(
      `${API_BASE}/users/me/payment-methods/${id}`,
      {
        method: "DELETE",
      }
    );
    if (res.ok) {
      loadSettings();
    }
  };

  return (
    <div className="stack">
      <div className="card stack">
        <div className="section-title">Profile</div>
        <div className="section-subtitle">
          Update your name and view your account role.
        </div>
        {message && (
          <div style={{ fontSize: "0.85rem", color: "#92400e" }}>
            {message}
          </div>
        )}
        <form className="stack-row" onSubmit={saveProfile}>
          <div style={{ flex: 2 }}>
            <div className="input-label">Name</div>
            <input
              className="input"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="input-label">Email</div>
            <input
              className="input"
              value={user.email}
              disabled
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="input-label">Role</div>
            <div className="tag-role">{user.role}</div>
          </div>
          <div>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>

      <div className="card stack">
        <div className="section-title">Addresses</div>
        <form className="stack" onSubmit={submitAddress}>
          <div className="input-row">
            <div style={{ flex: 1 }}>
              <div className="input-label">Label</div>
              <input
                className="input"
                value={addressForm.label}
                onChange={(e) =>
                  setAddressForm((f) => ({ ...f, label: e.target.value }))
                }
                required
              />
            </div>
            <div style={{ flex: 2 }}>
              <div className="input-label">Line 1</div>
              <input
                className="input"
                value={addressForm.line1}
                onChange={(e) =>
                  setAddressForm((f) => ({ ...f, line1: e.target.value }))
                }
                required
              />
            </div>
            <div style={{ flex: 2 }}>
              <div className="input-label">Line 2</div>
              <input
                className="input"
                value={addressForm.line2}
                onChange={(e) =>
                  setAddressForm((f) => ({ ...f, line2: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="input-row">
            <div style={{ flex: 1 }}>
              <div className="input-label">City</div>
              <input
                className="input"
                value={addressForm.city}
                onChange={(e) =>
                  setAddressForm((f) => ({ ...f, city: e.target.value }))
                }
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">State</div>
              <input
                className="input"
                value={addressForm.state}
                onChange={(e) =>
                  setAddressForm((f) => ({ ...f, state: e.target.value }))
                }
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Postal Code</div>
              <input
                className="input"
                value={addressForm.postalCode}
                onChange={(e) =>
                  setAddressForm((f) => ({
                    ...f,
                    postalCode: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Country</div>
              <input
                className="input"
                value={addressForm.country}
                onChange={(e) =>
                  setAddressForm((f) => ({ ...f, country: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem" }}>
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) =>
                  setAddressForm((f) => ({
                    ...f,
                    isDefault: e.target.checked,
                  }))
                }
              />{" "}
              Set as default shipping address
            </label>
          </div>
          <div className="stack-row">
            <button type="submit" className="btn-primary">
              {editingAddress ? "Update Address" : "Add Address"}
            </button>
            {editingAddress && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingAddress(null);
                  setAddressForm({
                    label: "",
                    line1: "",
                    line2: "",
                    city: "",
                    state: "",
                    postalCode: "",
                    country: "",
                    isDefault: true,
                  });
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
        {loading ? (
          <div>Loading addresses...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Address</th>
                <th>Default</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {addresses.map((addr) => (
                <tr key={addr.id}>
                  <td>{addr.label}</td>
                  <td>
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                    {addr.state} {addr.postal_code}, {addr.country}
                  </td>
                  <td>{addr.is_default ? "Yes" : ""}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditingAddress(addr);
                        setAddressForm({
                          label: addr.label,
                          line1: addr.line1,
                          line2: addr.line2 || "",
                          city: addr.city,
                          state: addr.state,
                          postalCode: addr.postal_code,
                          country: addr.country,
                          isDefault: !!addr.is_default,
                        });
                      }}
                    >
                      Edit
                    </button>{" "}
                    <button
                      className="btn-secondary"
                      onClick={() => deleteAddress(addr.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card stack">
        <div className="section-title">Payment Options</div>
        <form className="stack" onSubmit={submitPayment}>
          <div className="input-row">
            <div style={{ flex: 1 }}>
              <div className="input-label">Label</div>
              <input
                className="input"
                value={paymentForm.label}
                onChange={(e) =>
                  setPaymentForm((f) => ({ ...f, label: e.target.value }))
                }
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Card Last 4</div>
              <input
                className="input"
                value={paymentForm.cardLast4}
                onChange={(e) =>
                  setPaymentForm((f) => ({
                    ...f,
                    cardLast4: e.target.value,
                  }))
                }
                maxLength={4}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Provider</div>
              <input
                className="input"
                value={paymentForm.provider}
                onChange={(e) =>
                  setPaymentForm((f) => ({
                    ...f,
                    provider: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem" }}>
              <input
                type="checkbox"
                checked={paymentForm.isDefault}
                onChange={(e) =>
                  setPaymentForm((f) => ({
                    ...f,
                    isDefault: e.target.checked,
                  }))
                }
              />{" "}
              Set as default payment option
            </label>
          </div>
          <div className="stack-row">
            <button type="submit" className="btn-primary">
              {editingPayment ? "Update Payment" : "Add Payment"}
            </button>
            {editingPayment && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditingPayment(null);
                  setPaymentForm({
                    label: "",
                    cardLast4: "",
                    provider: "",
                    isDefault: true,
                  });
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
        {loading ? (
          <div>Loading payment methods...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Card</th>
                <th>Provider</th>
                <th>Default</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map((pm) => (
                <tr key={pm.id}>
                  <td>{pm.label}</td>
                  <td>•••• {pm.card_last4}</td>
                  <td>{pm.provider}</td>
                  <td>{pm.is_default ? "Yes" : ""}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditingPayment(pm);
                        setPaymentForm({
                          label: pm.label,
                          cardLast4: pm.card_last4,
                          provider: pm.provider,
                          isDefault: !!pm.is_default,
                        });
                      }}
                    >
                      Edit
                    </button>{" "}
                    <button
                      className="btn-secondary"
                      onClick={() => deletePayment(pm.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

