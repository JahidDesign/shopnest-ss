require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch"); // make sure installed
const { ObjectId } = require("mongodb");
const { getPaymentCollection } = require("../db");

const router = express.Router();

// Environment Variables
const BKASH_APP_KEY = process.env.BKASH_APP_KEY;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET;
const BKASH_USERNAME = process.env.BKASH_USERNAME;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD;
const BKASH_SANDBOX_URL = "https://tokenized.sandbox.bka.sh/v1.2.0-beta";

const NAGAD_SANDBOX_URL = "https://sandbox.mynagad.com/api";
const ROCKET_SANDBOX_URL = "https://sandbox.rocket.com/api"; // placeholder

// ------------------- Utility -------------------
// Save payment info to MongoDB
const savePayment = async (paymentData) => {
  const collection = await getPaymentCollection();
  await collection.insertOne(paymentData);
};

// ===================================================
// 🔹 bKash Payment Routes
// ===================================================

// 1️⃣ Generate bKash Token
router.post("/bkash/token", async (req, res) => {
  try {
    const response = await fetch(`${BKASH_SANDBOX_URL}/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_key: BKASH_APP_KEY,
        app_secret: BKASH_APP_SECRET,
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate bKash token" });
  }
});

// 2️⃣ Create bKash Payment
router.post("/bkash/create", async (req, res) => {
  const { amount, orderId, customerEmail, token } = req.body;

  if (!token) return res.status(400).json({ error: "bKash token is required" });

  try {
    const response = await fetch(`${BKASH_SANDBOX_URL}/payment/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`, // Must be Bearer token
        "x-app-key": BKASH_APP_KEY,
      },
      body: JSON.stringify({
        amount,
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: orderId,
      }),
    });

    const data = await response.json();

    await savePayment({
      method: "bKash",
      orderId,
      customerEmail,
      amount,
      status: data.status || "Pending",
      createdAt: new Date(),
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "bKash payment creation failed" });
  }
});

// ===================================================
// 🔹 Nagad Payment Routes
// ===================================================
router.post("/nagad/create", async (req, res) => {
  const { amount, orderId, customerEmail } = req.body;

  try {
    // Replace with actual Nagad API call
    const response = await fetch(`${NAGAD_SANDBOX_URL}/checkout/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, orderId }),
    });

    const data = await response.json();

    await savePayment({
      method: "Nagad",
      orderId,
      customerEmail,
      amount,
      status: "Pending",
      createdAt: new Date(),
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Nagad payment creation failed" });
  }
});

// ===================================================
// 🔹 Rocket Payment Routes
// ===================================================
router.post("/rocket/create", async (req, res) => {
  const { amount, orderId, customerEmail } = req.body;

  try {
    // Replace with actual Rocket API call
    const response = await fetch(`${ROCKET_SANDBOX_URL}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, orderId }),
    });

    const data = await response.json();

    await savePayment({
      method: "Rocket",
      orderId,
      customerEmail,
      amount,
      status: "Pending",
      createdAt: new Date(),
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Rocket payment creation failed" });
  }
});

// ===================================================
// 🔹 Manual Add Payment
// ===================================================
router.post("/add", async (req, res) => {
  try {
    const payment = { ...req.body, createdAt: new Date() };
    const collection = await getPaymentCollection();
    const result = await collection.insertOne(payment);

    res.json({
      success: true,
      message: "Payment added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add payment" });
  }
});

// ===================================================
// 🔹 Get All Payments
// ===================================================
router.get("/", async (req, res) => {
  try {
    const collection = await getPaymentCollection();
    const payments = await collection.find().sort({ createdAt: -1 }).toArray();
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// ===================================================
// 🔹 Get Single Payment
// ===================================================
router.get("/:id", async (req, res) => {
  try {
    const collection = await getPaymentCollection();
    const payment = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
});

// ===================================================
// 🔹 Export Router
// ===================================================
module.exports = router;
