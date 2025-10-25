const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");
const { getCreateOrderCollection } = require("../db");
const generateInvoice = require("../utils/generateInvoice");
require("dotenv").config();

const router = express.Router();

const STORE_ID = process.env.SSLCOMMERZ_STORE_ID;
const STORE_PASS = process.env.SSLCOMMERZ_STORE_PASS;
const CLIENT_URL = process.env.CLIENT_URL;
const SERVER_URL = process.env.SERVER_URL;

// 🧾 Create Order + Initiate Payment
router.post("/", async (req, res) => {
  const { amount, customer_name, customer_email, product_title, product_type } = req.body;
  if (!amount || !customer_name || !customer_email || !product_title) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const tran_id = "TRX" + Date.now();

  const sslData = {
    store_id: STORE_ID,
    store_passwd: STORE_PASS,
    total_amount: amount,
    currency: "BDT",
    tran_id,
    success_url: `${SERVER_URL}/orders/success/${tran_id}`,
    fail_url: `${SERVER_URL}/orders/fail/${tran_id}`,
    cancel_url: `${SERVER_URL}/orders/cancel/${tran_id}`,
    ipn_url: `${SERVER_URL}/orders/ipn`,
    cus_name: customer_name,
    cus_email: customer_email,
    cus_add1: "Dhaka",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
  };

  try {
    // Step 1: Initiate Payment
    const response = await fetch("https://sandbox.sslcommerz.com/gwprocess/v4/api.php", {
      method: "POST",
      body: new URLSearchParams(sslData),
    });
    const result = await response.json();

    // Step 2: Save Order
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

    // Step 3: Generate Invoice
    const { invoiceId } = await generateInvoice({
      ...orderData,
      status: "Pending",
    });

    // Step 4: Respond
    if (result.GatewayPageURL) {
      res.status(201).json({
        message: "Order created successfully",
        orderId: dbResult.insertedId,
        tran_id,
        ssl_redirect_url: result.GatewayPageURL,
        invoiceId,
      });
    } else {
      res.status(400).json({ error: "Failed to initialize payment" });
    }
  } catch (err) {
    console.error("Payment creation error:", err);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

// ✅ Success Callback
router.post("/success/:tranId", async (req, res) => {
  const { tranId } = req.params;
  try {
    await getCreateOrderCollection().updateOne(
      { tran_id: tranId },
      { $set: { status: "completed", paidAt: new Date() } }
    );
    res.redirect(`${CLIENT_URL}/payment-success?tranId=${tranId}`);
  } catch (err) {
    console.error("Success error:", err);
    res.status(500).send("Error processing success");
  }
});

// ❌ Failure Callback
router.post("/fail/:tranId", async (req, res) => {
  const { tranId } = req.params;
  try {
    await getCreateOrderCollection().updateOne(
      { tran_id: tranId },
      { $set: { status: "failed" } }
    );
    res.redirect(`${CLIENT_URL}/payment-failed?tranId=${tranId}`);
  } catch (err) {
    console.error("Fail error:", err);
    res.status(500).send("Error processing failure");
  }
});

// 🚫 Cancel Callback
router.post("/cancel/:tranId", async (req, res) => {
  const { tranId } = req.params;
  try {
    await getCreateOrderCollection().updateOne(
      { tran_id: tranId },
      { $set: { status: "cancelled" } }
    );
    res.redirect(`${CLIENT_URL}/payment-cancelled?tranId=${tranId}`);
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).send("Error processing cancel");
  }
});

// 🔁 IPN (Instant Payment Notification)
router.post("/ipn", async (req, res) => {
  try {
    const data = req.body;
    const { tran_id, status } = data;
    if (!tran_id) return res.status(400).send("No transaction ID");

    const order = await getCreateOrderCollection().findOne({ tran_id });
    if (!order) return res.status(404).send("Order not found");

    let orderStatus = "pending";
    if (status === "VALID" || status === "VALIDATED") orderStatus = "completed";
    else if (status === "FAILED") orderStatus = "failed";

    await getCreateOrderCollection().updateOne(
      { tran_id },
      { $set: { status: orderStatus, updatedAt: new Date(), ssl_ipn_response: data } }
    );

    res.status(200).send("IPN received");
  } catch (err) {
    console.error("IPN Error:", err);
    res.status(500).send("IPN error");
  }
});

// 🧾 Verify Payment Manually
router.get("/verify/:tranId", async (req, res) => {
  const { tranId } = req.params;
  try {
    const order = await getCreateOrderCollection().findOne({ tran_id: tranId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const verifyUrl = `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${req.query.val_id}&store_id=${STORE_ID}&store_passwd=${STORE_PASS}&format=json`;
    const verifyResponse = await fetch(verifyUrl);
    const verifyData = await verifyResponse.json();

    if (verifyData.status === "VALID" || verifyData.status === "VALIDATED") {
      await getCreateOrderCollection().updateOne(
        { tran_id: tranId },
        { $set: { status: "completed", verifiedAt: new Date() } }
      );
      res.json({ verified: true });
    } else {
      res.json({ verified: false });
    }
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Error verifying payment" });
  }
});

// 📋 Get All Orders
router.get("/", async (req, res) => {
  try {
    const orders = await getCreateOrderCollection().find().toArray();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// 📦 Get Order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await getCreateOrderCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ✏️ Update Order Status
router.patch("/:id", async (req, res) => {
  const { status } = req.body;
  if (!["pending", "completed", "failed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    await getCreateOrderCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } }
    );
    const updatedOrder = await getCreateOrderCollection().findOne({ _id: new ObjectId(req.params.id) });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

// 🗑 Delete Order
router.delete("/:id", async (req, res) => {
  try {
    const result = await getCreateOrderCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// 📄 Download Invoice
router.get("/invoice/:invoiceId", (req, res) => {
  const invoiceId = req.params.invoiceId;
  const filePath = path.join(__dirname, `../invoices/${invoiceId}.pdf`);
  if (fs.existsSync(filePath)) res.download(filePath);
  else res.status(404).json({ message: "Invoice not found" });
});

module.exports = router;
