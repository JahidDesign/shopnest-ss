// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: String,
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["admin", "getCustomerCollection()", "agent"], default: "getCustomerCollection()" },
  phone: String,
  photo: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
