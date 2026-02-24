import React, { useEffect, useState } from "react";
import { useAuth } from "../authContext";
import { formatINR } from "../utils/currency";

const API_BASE = "/api";

export default function AdminInventoryPage() {
  const { user, authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    type: "",
    brand: "",
    category: "",
    subsidyPercent: "",
    discountPercent: "",
    imageUrl: "",
  });
  const [message, setMessage] = useState("");

  const isAdmin = user && user.role === "admin";

  const loadInventory = async () => {
    if (!isAdmin) return;
    setLoading(true);
    const res = await authFetch(`${API_BASE}/admin/inventory`);
    const data = await res.json();
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadInventory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="card">
        Admin access required to manage inventory.
      </div>
    );
  }

  const startNew = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      stockQuantity: "",
      type: "",
      brand: "",
      category: "",
      subsidyPercent: "",
      discountPercent: "",
      imageUrl: "",
    });
  };

  const startEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      type: product.type || "",
      brand: product.brand || "",
      category: product.category || "",
      subsidyPercent: product.subsidyPercent || "",
      discountPercent: product.discountPercent || "",
      imageUrl: product.imageUrl || "",
    });
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      subsidyPercent: form.subsidyPercent ? Number(form.subsidyPercent) : 0,
      discountPercent: form.discountPercent ? Number(form.discountPercent) : 0,
    };
    const url = editing
      ? `${API_BASE}/products/${editing.id}`
      : `${API_BASE}/products`;
    const method = editing ? "PUT" : "POST";
    const res = await authFetch(url, {
      method,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Failed to save product");
    } else {
      setMessage("Product saved.");
      startNew();
      loadInventory();
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    const res = await authFetch(`${API_BASE}/products/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadInventory();
    }
  };

  return (
    <div className="stack">
      <div className="card stack">
        <div className="section-title">Inventory Management</div>
        <div className="section-subtitle">
          Add, edit, or remove fertilizer products and update stock quantities.
        </div>
        {message && (
          <div style={{ fontSize: "0.85rem", color: "#92400e" }}>
            {message}
          </div>
        )}
        <form className="stack" onSubmit={handleSubmit}>
          <div className="input-row">
            <div style={{ flex: 2 }}>
              <div className="input-label">Name</div>
              <input
                className="input"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Brand</div>
              <input
                className="input"
                value={form.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Type</div>
              <input
                className="input"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Category</div>
              <input
                className="input"
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
              />
            </div>
          </div>
          <div className="input-row">
            <div style={{ flex: 1 }}>
              <div className="input-label">Price (INR)</div>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Stock Quantity</div>
              <input
                className="input"
                type="number"
                value={form.stockQuantity}
                onChange={(e) =>
                  handleChange("stockQuantity", e.target.value)
                }
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Subsidy %</div>
              <input
                className="input"
                type="number"
                value={form.subsidyPercent}
                onChange={(e) =>
                  handleChange("subsidyPercent", e.target.value)
                }
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Discount %</div>
              <input
                className="input"
                type="number"
                value={form.discountPercent}
                onChange={(e) =>
                  handleChange("discountPercent", e.target.value)
                }
              />
            </div>
          </div>
          <div>
            <div className="input-label">Image URL</div>
            <input
              className="input"
              placeholder="Paste product image URL (optional)"
              value={form.imageUrl}
              onChange={(e) => handleChange("imageUrl", e.target.value)}
            />
          </div>
          <div>
            <div className="input-label">Description</div>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              required
            />
          </div>
          <div className="stack-row">
            <button type="submit" className="btn-primary">
              {editing ? "Update Product" : "Add Product"}
            </button>
            {editing && (
              <button
                type="button"
                className="btn-secondary"
                onClick={startNew}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="section-title">Current Stock</div>
        {loading ? (
          <div>Loading inventory...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Brand</th>
                <th>Type</th>
                <th>Category</th>
                <th>Image</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Subsidy</th>
                <th>Discount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.brand}</td>
                  <td>{p.type}</td>
                  <td>{p.category}</td>
                  <td>
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{formatINR(p.price)}</td>
                  <td>{p.stockQuantity}</td>
                  <td>{p.subsidyPercent}%</td>
                  <td>{p.discountPercent}%</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => startEdit(p)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      className="btn-secondary"
                      onClick={() => deleteProduct(p.id)}
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

