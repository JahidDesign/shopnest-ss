// routes/subscribers.js
const express = require("express");
const { ObjectId } = require("mongodb");
const { getSubscribersCollection } = require("../db");

const router = express.Router();

// ====================
// GET all subscribers
// ====================
router.get("/", async (req, res) => {
  try {
    const collection = await getSubscribersCollection();
    const subscribers = await collection.find().toArray();
    res.json(subscribers); // return array
  } catch (error) {
    console.error("[GET /subscribers] Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subscribers" });
  }
});

// ====================
// GET subscriber by ID
// ====================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const collection = await getSubscribersCollection();
    const subscriber = await collection.findOne({ _id: new ObjectId(id) });
    if (!subscriber) return res.status(404).json({ error: "Subscriber not found" });

    res.json(subscriber);
  } catch (error) {
    console.error(`[GET /subscribers/${req.params.id}] Error:`, error);
    res.status(500).json({ error: "Failed to fetch subscriber" });
  }
});

// ====================
// CREATE a new subscriber
// ====================
router.post("/", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email required" });

    const collection = await getSubscribersCollection();
    const result = await collection.insertOne({ name, email, createdAt: new Date() });

    res.status(201).json({
      success: true,
      message: "Subscribed successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("[POST /subscribers] Error:", error);
    res.status(500).json({ success: false, error: "Failed to create subscriber" });
  }
});

// ====================
// UPDATE subscriber by ID
// ====================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const collection = await getSubscribersCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Subscriber not found" });

    res.json({ success: true, message: "Subscriber updated successfully" });
  } catch (error) {
    console.error(`[PUT /subscribers/${req.params.id}] Error:`, error);
    res.status(500).json({ success: false, error: "Failed to update subscriber" });
  }
});

// ====================
// DELETE subscriber by ID
// ====================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const collection = await getSubscribersCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return res.status(404).json({ error: "Subscriber not found" });

    res.json({ success: true, message: "Subscriber deleted successfully" });
  } catch (error) {
    console.error(`[DELETE /subscribers/${req.params.id}] Error:`, error);
    res.status(500).json({ success: false, error: "Failed to delete subscriber" });
  }
});

module.exports = router;
