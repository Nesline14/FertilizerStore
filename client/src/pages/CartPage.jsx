import React, { useEffect, useState } from "react";
import { useAuth } from "../authContext";
import { formatINR } from "../utils/currency";

const API_BASE = "/api";

export default function CartPage() {
  const { user, authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadCart = async () => {
    if (!user) return;
    setLoading(true);
    const res = await authFetch(`${API_BASE}/cart`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return <div className="card">Please login to view your cart.</div>;
  }

  const updateQuantity = async (itemId, quantity) => {
    const res = await authFetch(`${API_BASE}/cart/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Failed to update cart");
    } else {
      setMessage("Cart updated.");
      loadCart();
    }
  };

  const removeItem = async (itemId) => {
    const res = await authFetch(`${API_BASE}/cart/${itemId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.message || "Failed to remove item");
    } else {
      loadCart();
    }
  };

  const placeOrder = async () => {
    const res = await authFetch(`${API_BASE}/orders`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Failed to place order");
    } else {
      setMessage(
        "Order placed successfully! You can track it from the My Orders page."
      );
      try {
        // simple visible notification
        window.alert("Order placed successfully!");
      } catch {
        // ignore if alert not available
      }
      loadCart();
    }
  };

  const total = items.reduce(
    (sum, i) => sum + i.product.finalPrice * i.quantity,
    0
  );

  return (
    <div className="stack">
      <div className="card">
        <div className="section-title">Shopping Cart</div>
        <div className="section-subtitle">
          Review items in your cart, adjust quantities, and place your order.
          Prices are shown in INR and already include applicable subsidies and
          discounts configured by the store.
        </div>
        {message && (
          <div style={{ fontSize: "0.85rem", color: "#92400e" }}>
            {message}
          </div>
        )}
      </div>
      {loading ? (
        <div>Loading cart...</div>
      ) : items.length === 0 ? (
        <div className="card">Your cart is empty.</div>
      ) : (
        <div className="stack">
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {item.product.brand} · {item.product.type}
                      </div>
                    </td>
                    <td>{formatINR(item.product.finalPrice)}</td>
                    <td>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        style={{ width: "4rem" }}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, Number(e.target.value))
                        }
                      />
                    </td>
                    <td>
                      {formatINR(
                        item.product.finalPrice * item.quantity
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card stack-row" style={{ alignItems: "center" }}>
            <div>
              <strong>Total:</strong> {formatINR(total)}
            </div>
            <button className="btn-primary" onClick={placeOrder}>
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

