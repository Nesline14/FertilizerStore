require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Product = require("./models/Product");

async function seedUsers() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log("Users already exist, skipping user seed.");
    return;
  }

  const adminPassword = await bcrypt.hash("admin123", 10);
  const customerPassword = await bcrypt.hash("customer123", 10);

  await User.create([
    {
      name: "Admin User",
      email: "admin@fertistore.local",
      passwordHash: adminPassword,
      role: "admin",
    },
    {
      name: "Farmer John",
      email: "john@farm.local",
      passwordHash: customerPassword,
      role: "customer",
    },
  ]);

  console.log("Seeded users (admin and customer).");
}

async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) {
    console.log("Products already exist, skipping product seed.");
    return;
  }

  const products = [
    {
      name: "NitroBoost Urea 46%",
      description:
        "High-nitrogen urea fertilizer suitable for cereals and grasses.",
      price: 25.0,
      stockQuantity: 120,
      type: "Nitrogen",
      brand: "AgriGrow",
      category: "Field Crops",
      subsidyPercent: 15,
      discountPercent: 0,
      imageUrl:
        "https://images.pexels.com/photos/5668886/pexels-photo-5668886.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "GreenRoot NPK 10-26-26",
      description:
        "Balanced NPK fertilizer for root development and flowering crops.",
      price: 30.0,
      stockQuantity: 80,
      type: "NPK",
      brand: "GreenLeaf",
      category: "Vegetables",
      subsidyPercent: 0,
      discountPercent: 10,
      imageUrl:
        "https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "Organic Compost Mix",
      description:
        "Certified organic compost for improving soil structure and microbes.",
      price: 18.5,
      stockQuantity: 50,
      type: "Organic",
      brand: "EcoFarm",
      category: "Horticulture",
      subsidyPercent: 5,
      discountPercent: 0,
      imageUrl:
        "https://images.pexels.com/photos/1301856/pexels-photo-1301856.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "Potash K2O 60%",
      description:
        "Potassium-rich fertilizer ideal for fruiting crops and sugarcane.",
      price: 28.0,
      stockQuantity: 0,
      type: "Potassium",
      brand: "AgriGrow",
      category: "Cash Crops",
      subsidyPercent: 0,
      discountPercent: 0,
      imageUrl:
        "https://images.pexels.com/photos/1901027/pexels-photo-1901027.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "SoilRich DAP 18-46",
      description:
        "Di-ammonium phosphate for strong root development in wheat and paddy.",
      price: 32.0,
      stockQuantity: 95,
      type: "NPK",
      brand: "BharatFert",
      category: "Field Crops",
      subsidyPercent: 12,
      discountPercent: 0,
      imageUrl:
        "https://images.pexels.com/photos/175414/pexels-photo-175414.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "MicroMix Plus",
      description:
        "Chelated micronutrient mixture to correct Zn, Fe, Mn, and Cu deficiencies.",
      price: 22.0,
      stockQuantity: 60,
      type: "Micronutrient",
      brand: "KrishiCare",
      category: "Horticulture",
      subsidyPercent: 0,
      discountPercent: 8,
      imageUrl:
        "https://images.pexels.com/photos/1212848/pexels-photo-1212848.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "DripSol NPK 19-19-19",
      description:
        "Water-soluble NPK fertilizer ideal for fertigation and drip systems.",
      price: 35.0,
      stockQuantity: 70,
      type: "Water Soluble",
      brand: "AquaGrow",
      category: "Vegetables",
      subsidyPercent: 5,
      discountPercent: 5,
      imageUrl:
        "https://images.pexels.com/photos/221015/pexels-photo-221015.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
    {
      name: "CityCompost Pellets",
      description:
        "Composted urban waste pellets approved by municipal corporation for field application.",
      price: 12.0,
      stockQuantity: 150,
      type: "Organic",
      brand: "CityGreen",
      category: "Field Crops",
      subsidyPercent: 0,
      discountPercent: 0,
      imageUrl:
        "https://images.pexels.com/photos/1172019/pexels-photo-1172019.jpeg?auto=compress&cs=tinysrgb&w=600",
    },
  ];

  await Product.create(products);
  console.log("Seeded products.");
}

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/fertistore";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB:", uri);

  await seedUsers();
  await seedProducts();

  await mongoose.disconnect();
  console.log("Database seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

