// routes/paymentsInsurance.js
const express = require("express");
const Stripe = require("stripe");
const { ObjectId } = require("mongodb");
const { getPaymentsInsuranceCollection } = require("../db.js");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Utility to generate unique payment IDs
const generatePaymentId = () =>
  "PI-" + Math.random().toString(36).substr(2, 9).toUpperCase();

// CREATE payment/order
router.post("/", async (req, res) => {
  const { policyId, title, premium, coverageAmount, type, userEmail } = req.body;
  if (!policyId || !premium || !title) {
    return res.status(400).json({ error: "Missing required policy fields" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(premium) * 100),
      currency: "usd",
      description: `${title} - ${type || "policy"}`,
      payment_method_types: ["card"],
      receipt_email: userEmail,
    });

    const paymentId = generatePaymentId();

    const orderData = {
      paymentId,
      policyId,
      title,
      type: type || "Standard",
      premium: Number(premium),
      coverageAmount: coverageAmount || "",
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      userEmail: userEmail || "",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await getPaymentsInsuranceCollection().insertOne(orderData);

    res.status(201).json({
      message: "Order created successfully",
      orderId: result.insertedId,
      paymentId,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Error creating payment:", err);
    res.status(500).json({ error: "Payment creation failed", details: err.message });
  }
});

// GET all payments
router.get("/", async (req, res) => {
  try {
    const orders = await getPaymentsInsuranceCollection()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// PATCH status
router.patch("/update-status/:paymentId", async (req, res) => {
  const { status } = req.body;
  const { paymentId } = req.params;

  if (!["pending", "completed", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const result = await getPaymentsInsuranceCollection().updateOne(
      { paymentId },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Order not found" });

    const updatedOrder = await getPaymentsInsuranceCollection().findOne({ paymentId });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

// DELETE order
router.delete("/:id", async (req, res) => {
  try {
    const result = await getPaymentsInsuranceCollection().deleteOne({
      _id: new ObjectId(req.params.id),
    });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

module.exports = router;
