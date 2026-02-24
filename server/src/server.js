const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const { authRequired, adminRequired, JWT_SECRET } = require("./authMiddleware");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Utility: map product row to API shape including computed final price.
function mapProduct(row) {
  const subsidy = row.subsidy_percent || 0;
  const discount = row.discount_percent || 0;
  const subsidyAmount = (row.price * subsidy) / 100;
  const discountAmount = (row.price * discount) / 100;
  const finalPrice = Math.max(row.price - subsidyAmount - discountAmount, 0);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    finalPrice,
    stockQuantity: row.stock_quantity,
    type: row.type,
    brand: row.brand,
    category: row.category,
    subsidyPercent: subsidy,
    discountPercent: discount,
  };
}

// ---------- Auth ----------

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password required" });
  }
  try {
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email.toLowerCase());
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')"
      )
      .run(name, email.toLowerCase(), passwordHash);
    const user = { id: result.lastInsertRowid, name, email: email.toLowerCase(), role: "customer" };
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  try {
    const row = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email.toLowerCase());
    if (!row) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = bcrypt.compareSync(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

app.get("/api/auth/me", authRequired, (req, res) => {
  try {
    const row = db
      .prepare("SELECT id, name, email, role FROM users WHERE id = ?")
      .get(req.user.id);
    res.json({ user: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

// ---------- Products ----------

app.get("/api/products", (req, res) => {
  const { search, type, brand, category, includeOutOfStock } = req.query;
  const conditions = [];
  const params = [];

  if (!includeOutOfStock) {
    conditions.push("stock_quantity > 0");
  }
  if (search) {
    conditions.push("(name LIKE ? OR description LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (type) {
    conditions.push("type = ?");
    params.push(type);
  }
  if (brand) {
    conditions.push("brand = ?");
    params.push(brand);
  }
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  try {
    const rows = db.prepare(`SELECT * FROM products ${where} ORDER BY name`).all(...params);
    res.json(rows.map(mapProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load products" });
  }
});

app.get("/api/products/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!row) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(mapProduct(row));
});

// Admin inventory management
app.post("/api/products", authRequired, adminRequired, (req, res) => {
  const {
    name,
    description,
    price,
    stockQuantity,
    type,
    brand,
    category,
    subsidyPercent,
    discountPercent,
  } = req.body;
  if (!name || !description || price == null || stockQuantity == null) {
    return res
      .status(400)
      .json({ message: "name, description, price, and stockQuantity are required" });
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO products (
        name, description, price, stock_quantity, type, brand, category,
        subsidy_percent, discount_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      name,
      description,
      price,
      stockQuantity,
      type || null,
      brand || null,
      category || null,
      subsidyPercent || 0,
      discountPercent || 0
    );
    const created = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(mapProduct(created));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create product" });
  }
});

app.put("/api/products/:id", authRequired, adminRequired, (req, res) => {
  const id = req.params.id;
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!existing) {
    return res.status(404).json({ message: "Product not found" });
  }
  const {
    name = existing.name,
    description = existing.description,
    price = existing.price,
    stockQuantity = existing.stock_quantity,
    type = existing.type,
    brand = existing.brand,
    category = existing.category,
    subsidyPercent = existing.subsidy_percent,
    discountPercent = existing.discount_percent,
  } = req.body;

  try {
    db.prepare(
      `UPDATE products
       SET name = ?, description = ?, price = ?, stock_quantity = ?,
           type = ?, brand = ?, category = ?, subsidy_percent = ?, discount_percent = ?
       WHERE id = ?`
    ).run(
      name,
      description,
      price,
      stockQuantity,
      type,
      brand,
      category,
      subsidyPercent,
      discountPercent,
      id
    );
    const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    res.json(mapProduct(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update product" });
  }
});

app.delete("/api/products/:id", authRequired, adminRequired, (req, res) => {
  const id = req.params.id;
  try {
    const info = db.prepare("DELETE FROM products WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

app.get("/api/admin/inventory", authRequired, adminRequired, (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM products ORDER BY stock_quantity ASC, name ASC")
      .all();
    res.json(rows.map(mapProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load inventory" });
  }
});

// ---------- Cart ----------

app.get("/api/cart", authRequired, (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT ci.id, ci.quantity, p.*
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = ?`
      )
      .all(req.user.id);
    const items = rows.map((row) => ({
      id: row.id,
      quantity: row.quantity,
      product: mapProduct(row),
    }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load cart" });
  }
});

app.post("/api/cart", authRequired, (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "productId and positive quantity required" });
  }
  try {
    const product = db
      .prepare("SELECT id, stock_quantity FROM products WHERE id = ?")
      .get(productId);
    if (!product || product.stock_quantity <= 0) {
      return res.status(400).json({ message: "Product not available" });
    }

    const existing = db
      .prepare(
        "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?"
      )
      .get(req.user.id, productId);
    if (existing) {
      db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(
        existing.quantity + quantity,
        existing.id
      );
    } else {
      db.prepare(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)"
      ).run(req.user.id, productId, quantity);
    }
    return res.status(201).json({ message: "Added to cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update cart" });
  }
});

app.put("/api/cart/:itemId", authRequired, (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Positive quantity required" });
  }
  try {
    const item = db
      .prepare("SELECT * FROM cart_items WHERE id = ? AND user_id = ?")
      .get(req.params.itemId, req.user.id);
    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(
      quantity,
      item.id
    );
    res.json({ message: "Cart updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update cart item" });
  }
});

app.delete("/api/cart/:itemId", authRequired, (req, res) => {
  try {
    const info = db
      .prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?")
      .run(req.params.itemId, req.user.id);
    if (info.changes === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove cart item" });
  }
});

// ---------- Wishlist ----------

app.get("/api/wishlist", authRequired, (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT wi.id, p.*
         FROM wishlist_items wi
         JOIN products p ON p.id = wi.product_id
         WHERE wi.user_id = ?`
      )
      .all(req.user.id);
    const items = rows.map((row) => ({
      id: row.id,
      product: mapProduct(row),
    }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load wishlist" });
  }
});

app.post("/api/wishlist", authRequired, (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }
  try {
    db.prepare(
      "INSERT OR IGNORE INTO wishlist_items (user_id, product_id) VALUES (?, ?)"
    ).run(req.user.id, productId);
    res.status(201).json({ message: "Added to wishlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update wishlist" });
  }
});

app.delete("/api/wishlist/:itemId", authRequired, (req, res) => {
  try {
    const info = db
      .prepare("DELETE FROM wishlist_items WHERE id = ? AND user_id = ?")
      .run(req.params.itemId, req.user.id);
    if (info.changes === 0) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove wishlist item" });
  }
});

// ---------- Orders ----------

app.post("/api/orders", authRequired, (req, res) => {
  // For simplicity, orders are always placed from the user's current cart.
  try {
    const cartRows = db
      .prepare(
        `SELECT ci.id as cart_item_id, ci.quantity, p.*
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = ?`
      )
      .all(req.user.id);

    if (cartRows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const tx = db.transaction(() => {
      let total = 0;
      for (const row of cartRows) {
        if (row.stock_quantity < row.quantity) {
          throw new Error(`Insufficient stock for ${row.name}`);
        }
        const subsidy = row.subsidy_percent || 0;
        const discount = row.discount_percent || 0;
        const subsidyAmount = (row.price * subsidy) / 100;
        const discountAmount = (row.price * discount) / 100;
        const finalPrice = Math.max(row.price - subsidyAmount - discountAmount, 0);
        total += finalPrice * row.quantity;
      }

      const orderResult = db
        .prepare(
          "INSERT INTO orders (user_id, status, total_amount) VALUES (?, 'placed', ?)"
        )
        .run(req.user.id, total);
      const orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare(
        `INSERT INTO order_items
         (order_id, product_id, quantity, unit_price, subsidy_percent, discount_percent)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      const updateStock = db.prepare(
        "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?"
      );

      for (const row of cartRows) {
        insertItem.run(
          orderId,
          row.id,
          row.quantity,
          row.price,
          row.subsidy_percent || 0,
          row.discount_percent || 0
        );
        updateStock.run(row.quantity, row.id);
      }

      db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.user.id);

      return orderId;
    });

    const orderId = tx();
    const order = db
      .prepare("SELECT * FROM orders WHERE id = ?")
      .get(orderId);
    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message || "Failed to place order" });
  }
});

app.get("/api/orders", authRequired, (req, res) => {
  try {
    const orders = db
      .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
      .all(req.user.id);
    const orderItems = db
      .prepare(
        `SELECT oi.*, p.name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`
      );
    const result = orders.map((o) => ({
      ...o,
      items: orderItems.all(o.id),
    }));
    res.json({ orders: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

app.get("/api/admin/orders", authRequired, adminRequired, (req, res) => {
  try {
    const orders = db
      .prepare(
        `SELECT o.*, u.name as customer_name, u.email as customer_email
         FROM orders o
         JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC`
      )
      .all();
    const orderItems = db
      .prepare(
        `SELECT oi.*, p.name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`
      );
    const result = orders.map((o) => ({
      ...o,
      items: orderItems.all(o.id),
    }));
    res.json({ orders: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load all orders" });
  }
});

// ---------- User profile / settings ----------

app.get("/api/users/me", authRequired, (req, res) => {
  try {
    const user = db
      .prepare("SELECT id, name, email, role FROM users WHERE id = ?")
      .get(req.user.id);
    const addresses = db
      .prepare("SELECT * FROM addresses WHERE user_id = ?")
      .all(req.user.id);
    const paymentMethods = db
      .prepare("SELECT * FROM payment_methods WHERE user_id = ?")
      .all(req.user.id);
    res.json({ user, addresses, paymentMethods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load user settings" });
  }
});

app.put("/api/users/me", authRequired, (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  try {
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, req.user.id);
    const user = db
      .prepare("SELECT id, name, email, role FROM users WHERE id = ?")
      .get(req.user.id);
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Addresses
app.post("/api/users/me/addresses", authRequired, (req, res) => {
  const { label, line1, line2, city, state, postalCode, country, isDefault } =
    req.body;
  if (!label || !line1 || !city || !state || !postalCode || !country) {
    return res.status(400).json({ message: "Missing required address fields" });
  }
  try {
    const tx = db.transaction(() => {
      if (isDefault) {
        db.prepare(
          "UPDATE addresses SET is_default = 0 WHERE user_id = ?"
        ).run(req.user.id);
      }
      const result = db
        .prepare(
          `INSERT INTO addresses
           (user_id, label, line1, line2, city, state, postal_code, country, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          req.user.id,
          label,
          line1,
          line2 || null,
          city,
          state,
          postalCode,
          country,
          isDefault ? 1 : 0
        );
      return result.lastInsertRowid;
    });
    const id = tx();
    const address = db
      .prepare("SELECT * FROM addresses WHERE id = ?")
      .get(id);
    res.status(201).json({ address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add address" });
  }
});

app.put("/api/users/me/addresses/:id", authRequired, (req, res) => {
  const id = req.params.id;
  const existing = db
    .prepare("SELECT * FROM addresses WHERE id = ? AND user_id = ?")
    .get(id, req.user.id);
  if (!existing) {
    return res.status(404).json({ message: "Address not found" });
  }
  const {
    label = existing.label,
    line1 = existing.line1,
    line2 = existing.line2,
    city = existing.city,
    state = existing.state,
    postalCode = existing.postal_code,
    country = existing.country,
    isDefault = existing.is_default,
  } = req.body;
  try {
    const tx = db.transaction(() => {
      if (isDefault) {
        db.prepare(
          "UPDATE addresses SET is_default = 0 WHERE user_id = ?"
        ).run(req.user.id);
      }
      db.prepare(
        `UPDATE addresses
         SET label = ?, line1 = ?, line2 = ?, city = ?, state = ?, postal_code = ?, country = ?, is_default = ?
         WHERE id = ? AND user_id = ?`
      ).run(
        label,
        line1,
        line2,
        city,
        state,
        postalCode,
        country,
        isDefault ? 1 : 0,
        id,
        req.user.id
      );
    });
    tx();
    const address = db
      .prepare("SELECT * FROM addresses WHERE id = ?")
      .get(id);
    res.json({ address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update address" });
  }
});

app.delete("/api/users/me/addresses/:id", authRequired, (req, res) => {
  try {
    const info = db
      .prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?")
      .run(req.params.id, req.user.id);
    if (info.changes === 0) {
      return res.status(404).json({ message: "Address not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete address" });
  }
});

// Payment methods
app.post("/api/users/me/payment-methods", authRequired, (req, res) => {
  const { label, cardLast4, provider, isDefault } = req.body;
  if (!label || !cardLast4 || !provider) {
    return res.status(400).json({ message: "Missing payment method fields" });
  }
  try {
    const tx = db.transaction(() => {
      if (isDefault) {
        db.prepare(
          "UPDATE payment_methods SET is_default = 0 WHERE user_id = ?"
        ).run(req.user.id);
      }
      const result = db
        .prepare(
          `INSERT INTO payment_methods
           (user_id, label, card_last4, provider, is_default)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          req.user.id,
          label,
          cardLast4,
          provider,
          isDefault ? 1 : 0
        );
      return result.lastInsertRowid;
    });
    const id = tx();
    const method = db
      .prepare("SELECT * FROM payment_methods WHERE id = ?")
      .get(id);
    res.status(201).json({ paymentMethod: method });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add payment method" });
  }
});

app.put("/api/users/me/payment-methods/:id", authRequired, (req, res) => {
  const id = req.params.id;
  const existing = db
    .prepare("SELECT * FROM payment_methods WHERE id = ? AND user_id = ?")
    .get(id, req.user.id);
  if (!existing) {
    return res.status(404).json({ message: "Payment method not found" });
  }
  const {
    label = existing.label,
    cardLast4 = existing.card_last4,
    provider = existing.provider,
    isDefault = existing.is_default,
  } = req.body;
  try {
    const tx = db.transaction(() => {
      if (isDefault) {
        db.prepare(
          "UPDATE payment_methods SET is_default = 0 WHERE user_id = ?"
        ).run(req.user.id);
      }
      db.prepare(
        `UPDATE payment_methods
         SET label = ?, card_last4 = ?, provider = ?, is_default = ?
         WHERE id = ? AND user_id = ?`
      ).run(label, cardLast4, provider, isDefault ? 1 : 0, id, req.user.id);
    });
    tx();
    const method = db
      .prepare("SELECT * FROM payment_methods WHERE id = ?")
      .get(id);
    res.json({ paymentMethod: method });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update payment method" });
  }
});

app.delete("/api/users/me/payment-methods/:id", authRequired, (req, res) => {
  try {
    const info = db
      .prepare("DELETE FROM payment_methods WHERE id = ? AND user_id = ?")
      .run(req.params.id, req.user.id);
    if (info.changes === 0) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete payment method" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Fertilizer store API listening on http://localhost:${PORT}`);
});

