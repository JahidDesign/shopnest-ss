const express = require("express");
const { ObjectId } = require("mongodb");
const { getReviewsCollection } = require("../db");
const router = express.Router();

function validateReview(data) {
  if (!data.productId) return "Product ID is required";
  if (!data.userId) return "User ID is required";
  if (data.rating === undefined || data.rating < 0 || data.rating > 5) return "Rating must be 0-5";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const collection = await getReviewsCollection();
    const items = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getReviewsCollection();
    const item = await collection.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: "Review not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

router.post("/", async (req, res) => {
  const error = validateReview(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getReviewsCollection();
    const newItem = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add review" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  const error = validateReview(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getReviewsCollection();
    const updatedData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Review not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update review" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getReviewsCollection();
    const patchData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: patchData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Review not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to patch review" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getReviewsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Review not found" });
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

module.exports = router;
