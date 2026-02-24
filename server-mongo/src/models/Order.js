const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  quantity: Number,
  unitPrice: Number,
  subsidyPercent: Number,
  discountPercent: Number,
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, default: "placed" },
    totalAmount: { type: Number, required: true },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

