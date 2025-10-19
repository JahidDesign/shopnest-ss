const express = require("express");
const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const authenticateToken = require("../middleware/authenticateToken");
const bcrypt = require("bcryptjs");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

// Register (Signup)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, photo = "", phone = "" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Name, email, and password are required." });
    }

    const existingCustomer = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (existingCustomer) {
      return res.status(409).json({ success: false, error: "Email already exists." });
    }

    const customer = new Customer({ name, email: email.toLowerCase().trim(), password, photo, phone });
    await customer.save();

    // password ফিল্ড সরিয়ে দিন
    const customerData = customer.toObject();
    delete customerData.password;

    return res.status(201).json({ success: true, message: "User created successfully", data: customerData });
  } catch (err) {
    console.error("Signup Error:", err);
    return res.status(500).json({ success: false, error: "Server error", details: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase()});
    if (!customer) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: customer._id.toString(), email: customer.email, role: customer.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // password ফিল্ড সরিয়ে দিন
    const customerData = customer.toObject();
    delete customerData.password;

    return res.json({ message: "Login successful", token, user: customerData });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Get all customers (protected)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const customers = await Customer.find().select("-password");
    return res.json({ success: true, data: customers });
  } catch (err) {
    console.error("Get All Customers Error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch customers" });
  }
});

// Get single customer (protected)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select("-password");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    return res.json({ success: true, data: customer });
  } catch (err) {
    console.error("Get Customer Error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch customer" });
  }
});

// Update customer (protected)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
    if (!updatedCustomer) return res.status(404).json({ success: false, message: "Customer not found" });

    return res.json({ success: true, data: updatedCustomer });
  } catch (err) {
    console.error("Update Customer Error:", err);
    return res.status(500).json({ success: false, error: "Failed to update customer" });
  }
});

// Delete customer (protected)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) return res.status(404).json({ success: false, message: "Customer not found" });
    return res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Delete Customer Error:", err);
    return res.status(500).json({ success: false, error: "Failed to delete customer" });
  }
});

module.exports = router;
