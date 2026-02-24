import React, { useEffect, useState } from "react";
import { useAuth } from "../authContext";

const API_BASE = "/api";

export default function WishlistPage() {
  const { user, authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    if (!user) return;
    setLoading(true);
    const res = await authFetch(`${API_BASE}/wishlist`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return <div className="card">Please login to view your wishlist.</div>;
  }

  const removeItem = async (itemId) => {
    const res = await authFetch(`${API_BASE}/wishlist/${itemId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadWishlist();
    }
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="section-title">Wishlist</div>
        <div className="section-subtitle">
          Products that you have saved for later.
        </div>
      </div>
      {loading ? (
        <div>Loading wishlist...</div>
      ) : items.length === 0 ? (
        <div className="card">Your wishlist is empty.</div>
      ) : (
        <div className="products-grid">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div className="product-card-title">{item.product.name}</div>
              <div className="product-meta">
                {item.product.brand} · {item.product.type}
              </div>
              <div className="price-row">
                <span className="price-final">
                  ${item.product.finalPrice.toFixed(2)}
                </span>
              </div>
              <button
                className="btn-secondary"
                onClick={() => removeItem(item.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

