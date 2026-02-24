require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { authRequired, adminRequired, JWT_SECRET } = require("./auth");
const User = require("./models/User");
const Product = require("./models/Product");
const CartItem = require("./models/CartItem");
const WishlistItem = require("./models/WishlistItem");
const Order = require("./models/Order");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fertistore")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

function mapProduct(doc) {
  const subsidy = doc.subsidyPercent || 0;
  const discount = doc.discountPercent || 0;
  const subsidyAmount = (doc.price * subsidy) / 100;
  const discountAmount = (doc.price * discount) / 100;
  const finalPrice = Math.max(doc.price - subsidyAmount - discountAmount, 0);
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    finalPrice,
    stockQuantity: doc.stockQuantity,
    type: doc.type,
    brand: doc.brand,
    category: doc.category,
    subsidyPercent: subsidy,
    discountPercent: discount,
    imageUrl: doc.imageUrl || null,
  };
}

// ----- Auth -----

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password required" });
  }
  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "customer",
    });
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

app.get("/api/auth/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).select("name email role");
  res.json({ user });
});

// ----- Products / Inventory -----

app.get("/api/products", async (req, res) => {
  const { search, type, brand, category } = req.query;
  const filter = { stockQuantity: { $gt: 0 } };
  if (search) {
    filter.$or = [
      { name: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
    ];
  }
  if (type) filter.type = type;
  if (brand) filter.brand = brand;
  if (category) filter.category = category;

  try {
    const products = await Product.find(filter).sort({ name: 1 });
    res.json(products.map(mapProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(mapProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load product" });
  }
});

app.post("/api/products", authRequired, adminRequired, async (req, res) => {
  const body = req.body;
  if (!body.name || !body.description || body.price == null || body.stockQuantity == null) {
    return res
      .status(400)
      .json({ message: "name, description, price and stockQuantity are required" });
  }
  try {
    const product = await Product.create({
      name: body.name,
      description: body.description,
      price: body.price,
      stockQuantity: body.stockQuantity,
      type: body.type,
      brand: body.brand,
      category: body.category,
      subsidyPercent: body.subsidyPercent || 0,
      discountPercent: body.discountPercent || 0,
    });
    res.status(201).json(mapProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create product" });
  }
});

app.put("/api/products/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(mapProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update product" });
  }
});

app.delete("/api/products/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const result = await Product.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Product not found" });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

app.get("/api/admin/inventory", authRequired, adminRequired, async (req, res) => {
  try {
    const products = await Product.find().sort({ stockQuantity: 1, name: 1 });
    res.json(products.map(mapProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load inventory" });
  }
});

// metadata for filters
app.get("/api/products/metadata", async (req, res) => {
  try {
    const [types, brands, categories] = await Promise.all([
      Product.distinct("type", { stockQuantity: { $gt: 0 }, type: { $ne: null } }),
      Product.distinct("brand", { stockQuantity: { $gt: 0 }, brand: { $ne: null } }),
      Product.distinct("category", {
        stockQuantity: { $gt: 0 },
        category: { $ne: null },
      }),
    ]);
    res.json({ types, brands, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load filters" });
  }
});

// ----- Cart -----

app.get("/api/cart", authRequired, async (req, res) => {
  try {
    const items = await CartItem.find({ user: req.user.id }).populate("product");
    res.json({
      items: items.map((i) => ({
        id: i._id,
        quantity: i.quantity,
        product: mapProduct(i.product),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load cart" });
  }
});

app.post("/api/cart", authRequired, async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "productId and positive quantity required" });
  }
  try {
    const product = await Product.findById(productId);
    if (!product || product.stockQuantity <= 0) {
      return res.status(400).json({ message: "Product not available" });
    }
    const existing = await CartItem.findOne({ user: req.user.id, product: productId });
    if (existing) {
      existing.quantity += quantity;
      await existing.save();
    } else {
      await CartItem.create({ user: req.user.id, product: productId, quantity });
    }
    res.status(201).json({ message: "Added to cart" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update cart" });
  }
});

app.put("/api/cart/:id", authRequired, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Positive quantity required" });
  }
  try {
    const item = await CartItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { quantity } },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Cart item not found" });
    res.json({ message: "Cart updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update cart item" });
  }
});

app.delete("/api/cart/:id", authRequired, async (req, res) => {
  try {
    const result = await CartItem.deleteOne({ _id: req.params.id, user: req.user.id });
    if (!result.deletedCount) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove cart item" });
  }
});

// ----- Wishlist -----

app.get("/api/wishlist", authRequired, async (req, res) => {
  try {
    const items = await WishlistItem.find({ user: req.user.id }).populate("product");
    res.json({
      items: items.map((i) => ({
        id: i._id,
        product: mapProduct(i.product),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load wishlist" });
  }
});

app.post("/api/wishlist", authRequired, async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ message: "productId is required" });
  }
  try {
    await WishlistItem.updateOne(
      { user: req.user.id, product: productId },
      {},
      { upsert: true }
    );
    res.status(201).json({ message: "Added to wishlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update wishlist" });
  }
});

app.delete("/api/wishlist/:id", authRequired, async (req, res) => {
  try {
    const result = await WishlistItem.deleteOne({ _id: req.params.id, user: req.user.id });
    if (!result.deletedCount) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove wishlist item" });
  }
});

// ----- Orders -----

app.post("/api/orders", authRequired, async (req, res) => {
  try {
    const cartItems = await CartItem.find({ user: req.user.id }).populate("product");
    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;
    for (const ci of cartItems) {
      if (ci.product.stockQuantity < ci.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${ci.product.name}` });
      }
      const mapped = mapProduct(ci.product);
      total += mapped.finalPrice * ci.quantity;
    }

    const items = cartItems.map((ci) => ({
      product: ci.product._id,
      name: ci.product.name,
      quantity: ci.quantity,
      unitPrice: ci.product.price,
      subsidyPercent: ci.product.subsidyPercent || 0,
      discountPercent: ci.product.discountPercent || 0,
    }));

    const orderDoc = await Order.create({
      user: req.user.id,
      totalAmount: total,
      items,
    });

    for (const ci of cartItems) {
      await Product.updateOne(
        { _id: ci.product._id },
        { $inc: { stockQuantity: -ci.quantity } }
      );
    }
    await CartItem.deleteMany({ user: req.user.id });

    res.status(201).json({ order: orderDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to place order" });
  }
});

app.get("/api/orders", authRequired, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({
      orders: orders.map((o) => ({
        id: o._id,
        status: o.status,
        total_amount: o.totalAmount,
        created_at: o.createdAt,
        items: o.items.map((it, idx) => ({
          id: idx,
          name: it.name,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          subsidy_percent: it.subsidyPercent,
          discount_percent: it.discountPercent,
        })),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

app.get("/api/admin/orders", authRequired, adminRequired, async (req, res) => {
  try {
    const orders = await Order.find().populate("user").sort({ createdAt: -1 });
    res.json({
      orders: orders.map((o) => ({
        id: o._id,
        status: o.status,
        total_amount: o.totalAmount,
        created_at: o.createdAt,
        customer_name: o.user?.name,
        customer_email: o.user?.email,
        items: o.items,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load all orders" });
  }
});

// ----- User settings -----

app.get("/api/users/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role addresses paymentMethods"
    );
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      addresses: user.addresses,
      paymentMethods: user.paymentMethods,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load user settings" });
  }
});

app.put("/api/users/me", authRequired, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name } },
      { new: true }
    ).select("name email role");
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Mongo-backed API listening on http://localhost:${PORT}`);
});

