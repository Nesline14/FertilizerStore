import React, { useEffect, useState } from "react";
import { useAuth } from "../authContext";
import { formatINR } from "../utils/currency";

const API_BASE = "/api";

export default function AdminOrdersPage() {
  const { user, authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user && user.role === "admin";

  const loadOrders = async () => {
    if (!isAdmin) return;
    setLoading(true);
    const res = await authFetch(`${API_BASE}/admin/orders`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="card">
        Admin access required to view all orders.
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="section-title">All Orders</div>
        <div className="section-subtitle">
          View all orders placed across the store.
        </div>
      </div>
      {loading ? (
        <div>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="card">No orders have been placed yet.</div>
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
                <div style={{ fontSize: "0.8rem" }}>
                  Customer: {order.customer_name} ({order.customer_email})
                </div>
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

