const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  label: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  postalCode: String,
  country: String,
  isDefault: { type: Boolean, default: false },
});

const paymentMethodSchema = new mongoose.Schema({
  label: String,
  cardLast4: String,
  provider: String,
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
    addresses: [addressSchema],
    paymentMethods: [paymentMethodSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

