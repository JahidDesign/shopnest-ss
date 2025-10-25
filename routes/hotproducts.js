const express = require("express");
const { ObjectId } = require("mongodb");
const { getHotProductsCollection } = require("../db");
const router = express.Router();

function validateItem(data) {
  if (!data.name) return "Name is required";
  if (data.price === undefined || data.price === null) return "Price is required";
  if (data.rating !== undefined && (data.rating < 0 || data.rating > 5)) return "Rating must be 0-5";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const { minRating, sortBy, order } = req.query;
    const collection = await getHotProductsCollection();
    const query = {};
    if (minRating !== undefined) query.rating = { $gte: Number(minRating) };
    const sortOptions = {};
    if (sortBy) {
      const sortOrder = order === "desc" ? -1 : 1;
      if (["price", "rating", "createdAt"].includes(sortBy)) sortOptions[sortBy] = sortOrder;
    } else sortOptions.createdAt = -1;
    const items = await collection.find(query).sort(sortOptions).toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getHotProductsCollection();
    const item = await collection.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

router.post("/", async (req, res) => {
  const error = validateItem(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getHotProductsCollection();
    const newItem = { ...req.body, rating: req.body.rating || 0, createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add item" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  const error = validateItem(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getHotProductsCollection();
    const updatedData = { ...req.body, rating: req.body.rating || 0, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Item not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update item" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getHotProductsCollection();
    const patchData = { ...req.body };
    if (patchData.rating === undefined) patchData.rating = 0;
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...patchData, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Item not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to patch item" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getHotProductsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

module.exports = router;
