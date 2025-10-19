import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  uid: { type: String, required: true }, // Firebase UID
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Only for email/password accounts
  photo: { type: String },
  phone: { type: String },
  role: { type: String, default: "customer" },
  status: { type: String, default: "active" },
}, { timestamps: true });

export default mongoose.model("Customer", customerSchema);
