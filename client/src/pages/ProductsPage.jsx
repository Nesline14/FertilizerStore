import React, { useEffect, useState } from "react";
import { useAuth } from "../authContext";
import { formatINR } from "../utils/currency";

const API_BASE = "/api";

export default function ProductsPage() {
  const { authFetch, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [typeOptions, setTypeOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [message, setMessage] = useState("");
  const [cartItems, setCartItems] = useState([]);

  const loadProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (brand) params.set("brand", brand);
    if (category) params.set("category", category);
    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  const loadFilters = async () => {
    const res = await fetch(`${API_BASE}/products/metadata`);
    if (!res.ok) return;
    const data = await res.json();
    const defaultTypes = [
      "NPK",
      "Nitrogen",
      "Potassium",
      "Organic",
      "Micronutrient",
      "Water Soluble",
    ];
    const defaultBrands = [
      "AgriGrow",
      "GreenLeaf",
      "EcoFarm",
      "BharatFert",
      "KrishiCare",
      "AquaGrow",
      "CityGreen",
    ];
    const defaultCategories = [
      "Field Crops",
      "Vegetables",
      "Horticulture",
      "Cash Crops",
    ];
    setTypeOptions(data.types && data.types.length ? data.types : defaultTypes);
    setBrandOptions(
      data.brands && data.brands.length ? data.brands : defaultBrands
    );
    setCategoryOptions(
      data.categories && data.categories.length
        ? data.categories
        : defaultCategories
    );
  };

  const loadCart = async () => {
    if (!user) return;
    const res = await authFetch(`${API_BASE}/cart`);
    if (!res.ok) return;
    const data = await res.json();
    setCartItems(data.items || []);
  };

  useEffect(() => {
    loadProducts();
    loadFilters();
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddToCart = async (productId) => {
    if (!user) {
      setMessage("Please login to add to cart.");
      return;
    }
    const res = await authFetch(`${API_BASE}/cart`, {
      method: "POST",
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "Failed to add to cart");
    } else {
      setMessage("Added to cart.");
      loadCart();
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadProducts();
  };

  return (
    <div className="stack">
      <div className="card">
        <div className="section-title">Fertilizer Catalog</div>
        <div className="section-subtitle">
          Browse government-subsidised and premium fertilizers. Only
          in-stock products are shown. Use filters to narrow down by type,
          brand, or crop category.
        </div>
        <form className="stack" onSubmit={handleFilterSubmit}>
          <div className="input-row">
            <div style={{ flex: 2 }}>
              <div className="input-label">Search</div>
              <input
                className="input"
                placeholder="Search by name or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Type</div>
              <select
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">All types</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Brand</div>
              <select
                className="input"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              >
                <option value="">All brands</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div className="input-label">Category</div>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <button type="submit" className="btn-primary">
              Apply Filters
            </button>
          </div>
          {message && (
            <div style={{ fontSize: "0.85rem", color: "#92400e" }}>
              {message}
            </div>
          )}
        </form>
      </div>

      {loading ? (
        <div>Loading products...</div>
      ) : (
        <div className="products-grid">
          {products.map((p) => {
            const cartEntry = cartItems.find(
              (ci) => ci.product.id === p.id
            );
            const qtyInCart = cartEntry ? cartEntry.quantity : 0;
            return (
              <div key={p.id} className="card">
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      borderRadius: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  />
                )}
              <div className="product-card-title">{p.name}</div>
              <div className="product-meta">
                {p.brand && <span>{p.brand} · </span>}
                {p.type && <span>{p.type} · </span>}
                {p.category && <span>{p.category}</span>}
              </div>
              <div style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                {p.description}
              </div>
              <div className="price-row">
                <span className="price-final">
                  {formatINR(p.finalPrice)}
                </span>
                {p.finalPrice !== p.price && (
                  <span className="price-original">
                    {formatINR(p.price)}
                  </span>
                )}
              </div>
              <div className="badge-row">
                <span className="badge">
                  In stock: {p.stockQuantity}
                </span>
                {qtyInCart > 0 && (
                  <span className="badge">
                    In cart: {qtyInCart}
                  </span>
                )}
                {p.subsidyPercent > 0 && (
                  <span className="badge subsidy">
                    Subsidy {p.subsidyPercent}%
                  </span>
                )}
                {p.discountPercent > 0 && (
                  <span className="badge discount">
                    Discount {p.discountPercent}%
                  </span>
                )}
              </div>
                <div className="stack-row">
                  <button
                    className="btn-primary"
                    onClick={() => handleAddToCart(p.id)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

