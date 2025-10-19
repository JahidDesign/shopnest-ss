const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/loguse");
const router = express.Router();
const { getRegisterCollection } = require("../db");
// JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

// ===== Signup =====
router.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        // Check if user exists
        const existingUser = await getRegisterCollection.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: "Email already exists" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});

// ===== Login =====
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ success: false, message: "All fields are required" });

    try {
        // Find user
        const user = await getRegisterCollection.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "Invalid email or password" });

        // Check password
        const isMatch = await getRegisterCollection.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid email or password" });

        // Sign JWT
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});

module.exports = router;
