import React, { useEffect, useState } from "react";
import { useAuth } from "../authContext";
import { formatINR } from "../utils/currency";

const API_BASE = "/api";

export default function OrdersPage() {
  const { user, authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    const res = await authFetch(`${API_BASE}/orders`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return <div className="card">Please login to view your orders.</div>;
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="section-title">Order History</div>
        <div className="section-subtitle">
          View orders you have placed with FertiStore.
        </div>
      </div>
      {loading ? (
        <div>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="card">You have not placed any orders yet.</div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="card">
            <div className="stack-row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>Order #{order.id}</strong>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  Placed at {order.created_at}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "0.8rem" }}>Status: {order.status}</span>
                <div>
                  <strong>Total:</strong> {formatINR(order.total_amount)}
                </div>
              </div>
            </div>
            <table className="table" style={{ marginTop: "0.75rem" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Subsidy</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatINR(item.unit_price)}</td>
                    <td>{item.subsidy_percent}%</td>
                    <td>{item.discount_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

