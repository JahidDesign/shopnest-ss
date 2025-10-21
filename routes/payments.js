require('dotenv').config();
const express = require("express");
const fetch = require("node-fetch");
const { ObjectId } = require("mongodb");
const { getCreateOrderCollection } = require("../db"); // single collection for orders
const router = express.Router();

const STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const STORE_PASS = process.env.SSLCOMMERZ_STORE_PASS;
const CLIENT_URL = process.env.CLIENT_URL;

// ✅ CREATE Payment / Order
router.post("/", async (req, res) => {
  const { amount, customer_name, customer_email, product_title, product_type } = req.body;

  if (!amount || !customer_name || !customer_email || !product_title) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const tran_id = "TRX" + Date.now();

  const data = {
    store_id: STORE_ID,
    store_passwd: STORE_PASS,
    total_amount: amount,
    currency: "BDT",
    tran_id,
    success_url: `${CLIENT_URL}/success?tran_id=${tran_id}`,
    fail_url: `${CLIENT_URL}/fail?tran_id=${tran_id}`,
    cancel_url: `${CLIENT_URL}/cancel?tran_id=${tran_id}`,
    cus_name: customer_name,
    cus_email: customer_email,
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
  };

  try {
    // Call SSLCOMMERZ API
    const response = await fetch(
      "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
      { method: "POST", body: new URLSearchParams(data) }
    );
    const result = await response.json();

    // Save order in MongoDB
    const orderData = {
      tran_id,
      amount,
      customer_name,
      customer_email,
      product_title,
      product_type,
      status: "pending",
      payment_gateway: "SSLCOMMERZ",
      gateway_response: result,
      createdAt: new Date(),
    };

    const dbResult = await getCreateOrderCollection().insertOne(orderData);

    res.status(201).json({
      message: "Order created",
      orderId: dbResult.insertedId,
      ssl_redirect_url: result.GatewayPageURL,
    });
  } catch (err) {
    console.error("Payment creation error:", err);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// ✅ GET All Orders
router.get("/", async (req, res) => {
  try {
    const orders = await getCreateOrderCollection().find().toArray();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ✅ UPDATE Order Status (Accept/Reject/Completed)
router.patch("/:id", async (req, res) => {
  const { status } = req.body;

  if (!["pending", "completed", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const result = await getCreateOrderCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Order not found" });

    const updatedOrder = await getCreateOrderCollection().findOne({ _id: new ObjectId(req.params.id) });
    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// ✅ DELETE Order
router.delete("/:id", async (req, res) => {
  try {
    const result = await getCreateOrderCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

module.exports = router;
