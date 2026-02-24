const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    stockQuantity: { type: Number, default: 0 },
    type: String,
    brand: String,
    category: String,
    imageUrl: String,
    subsidyPercent: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

