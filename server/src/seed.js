const bcrypt = require("bcryptjs");
const db = require("./db");

// Simple seeding script to populate initial users and products.
// You can run: `npm run seed` inside the `server` folder.

function seedUsers() {
  const existing = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  if (existing.count > 0) {
    return;
  }

  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
  );

  const passwordAdmin = bcrypt.hashSync("admin123", 10);
  const passwordCustomer = bcrypt.hashSync("customer123", 10);

  insertUser.run("Admin User", "admin@fertistore.local", passwordAdmin, "admin");
  insertUser.run(
    "Farmer John",
    "john@farm.local",
    passwordCustomer,
    "customer"
  );

  console.log("Seeded users (admin and customer).");
}

function seedProducts() {
  const existing = db.prepare("SELECT COUNT(*) AS count FROM products").get();
  if (existing.count > 0) {
    return;
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, description, price, stock_quantity,
      type, brand, category, subsidy_percent, discount_percent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    {
      name: "NitroBoost Urea 46%",
      description: "High-nitrogen urea fertilizer suitable for cereals and grasses.",
      price: 25.0,
      stock_quantity: 120,
      type: "Nitrogen",
      brand: "AgriGrow",
      category: "Field Crops",
      subsidy_percent: 15,
      discount_percent: 0,
    },
    {
      name: "GreenRoot NPK 10-26-26",
      description:
        "Balanced NPK fertilizer for root development and flowering crops.",
      price: 30.0,
      stock_quantity: 80,
      type: "NPK",
      brand: "GreenLeaf",
      category: "Vegetables",
      subsidy_percent: 0,
      discount_percent: 10,
    },
    {
      name: "Organic Compost Mix",
      description:
        "Certified organic compost for improving soil structure and microbial activity.",
      price: 18.5,
      stock_quantity: 50,
      type: "Organic",
      brand: "EcoFarm",
      category: "Horticulture",
      subsidy_percent: 5,
      discount_percent: 0,
    },
    {
      name: "Potash K2O 60%",
      description:
        "Potassium-rich fertilizer ideal for fruiting crops and sugarcane.",
      price: 28.0,
      stock_quantity: 0, // this one will demonstrate out-of-stock filtering
      type: "Potassium",
      brand: "AgriGrow",
      category: "Cash Crops",
      subsidy_percent: 0,
      discount_percent: 0,
    },
  ];

  const insertMany = db.transaction((rows) => {
    for (const p of rows) {
      insertProduct.run(
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.type,
        p.brand,
        p.category,
        p.subsidy_percent,
        p.discount_percent
      );
    }
  });

  insertMany(products);
  console.log("Seeded products.");
}

function main() {
  seedUsers();
  seedProducts();
  console.log("Database seed complete.");
}

main();

