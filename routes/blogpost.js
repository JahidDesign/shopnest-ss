// routes/tours.js
const express = require("express");
const { ObjectId } = require("mongodb");
const { getBlogPostCollection } = require("../db"); // replace with your collection

const router = express.Router();

/**
 * GET /tours
 * Get all tours
 */
router.get("/", async (req, res) => {
  try {
    const tours = await getBlogPostCollection().find().toArray();
    res.status(200).json(tours);
  } catch (err) {
    console.error("Failed to fetch tours:", err);
    res.status(500).json({ error: "Failed to fetch tour bookings" });
  }
});

/**
 * GET /tours/:id
 * Get a single tour by ID and increment visitor count
 */
router.get("/:id", async (req, res) => {
  try {
    const tourId = req.params.id;
    const collection = getBlogPostCollection();

    // Increment visitor count
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(tourId) },
      { $inc: { views: 1 } }, // increment visitor count
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Tour not found" });
    res.status(200).json(result.value);
  } catch (err) {
    console.error("Failed to fetch tour:", err);
    res.status(400).json({ error: "Invalid tour ID" });
  }
});

/**
 * POST /tours
 * Create a new tour
 */
router.post("/", async (req, res) => {
  try {
    const tourData = {
      ...req.body,
      views: 0, // initialize visitor count
    };
    const result = await getBlogPostCollection().insertOne(tourData);
    res.status(201).json({ message: "Tour created", insertedId: result.insertedId });
  } catch (err) {
    console.error("Failed to create tour:", err);
    res.status(400).json({ error: "Failed to create tour" });
  }
});

/**
 * PUT /tours/:id
 * Update a tour
 */
router.put("/:id", async (req, res) => {
  try {
    const tourId = req.params.id;
    const updateData = req.body;

    const result = await getBlogPostCollection().updateOne(
      { _id: new ObjectId(tourId) },
      { $set: updateData },
      { upsert: false }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Tour not found" });
    res.status(200).json({ message: "Tour updated successfully", result });
  } catch (err) {
    console.error("Failed to update tour:", err);
    res.status(400).json({ error: "Failed to update tour" });
  }
});

/**
 * DELETE /tours/:id
 * Delete a tour
 */
router.delete("/:id", async (req, res) => {
  try {
    const tourId = req.params.id;
    const result = await getBlogPostCollection().deleteOne({ _id: new ObjectId(tourId) });

    if (result.deletedCount === 0) return res.status(404).json({ error: "Tour not found" });
    res.status(200).json({ message: "Tour deleted successfully" });
  } catch (err) {
    console.error("Failed to delete tour:", err);
    res.status(400).json({ error: "Failed to delete tour" });
  }
});

/**
 * PATCH /tours/:id/views
 * Increment only the visitor count
 */
router.patch("/:id/views", async (req, res) => {
  try {
    const tourId = req.params.id;
    const result = await getBlogPostCollection().findOneAndUpdate(
      { _id: new ObjectId(tourId) },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Tour not found" });
    res.status(200).json({ message: "Visitor count incremented", views: result.value.views });
  } catch (err) {
    console.error("Failed to increment views:", err);
    res.status(400).json({ error: "Invalid tour ID" });
  }
});

module.exports = router;
