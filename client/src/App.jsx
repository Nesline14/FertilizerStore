import React, { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { AuthContextProvider, useAuth } from "./authContext";
import ProductsPage from "./pages/ProductsPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import AdminInventoryPage from "./pages/AdminInventoryPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <Link to="/">FertiStore</Link>
        </div>
        <button
          className="nav-toggle"
          onClick={() => setMobileOpen((o) => !o)}
        >
          ☰
        </button>
        <nav className={`app-nav ${mobileOpen ? "open" : ""}`}>
          <NavLink to="/" end>
            Products
          </NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/orders">My Orders</NavLink>
          <NavLink to="/settings">Settings</NavLink>
          {user && user.role === "admin" && (
            <>
              <NavLink to="/admin/inventory">Inventory</NavLink>
              <NavLink to="/admin/orders">All Orders</NavLink>
            </>
          )}
        </nav>
        <div className="auth-section">
          {user ? (
            <>
              <span className="user-chip">
                {user.name} ({user.role})
              </span>
              <button className="btn-secondary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <small>FertiStore &copy; {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
}

function AppInner() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin/inventory" element={<AdminInventoryPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthContextProvider>
      <AppInner />
    </AuthContextProvider>
  );
}

