const express = require("express");
const { ObjectId } = require("mongodb");
const { getStockCollection } = require("../db");
const router = express.Router();

function validateStock(data) {
  if (!data.productId) return "Product ID is required";
  if (data.quantity === undefined || isNaN(data.quantity)) return "Quantity is required";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const collection = await getStockCollection();
    const items = await collection.find({}).sort({ updatedAt: -1 }).toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stock items" });
  }
});

router.post("/", async (req, res) => {
  const error = validateStock(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getStockCollection();
    const newItem = { ...req.body, updatedAt: new Date() };
    const result = await collection.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add stock item" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getStockCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...req.body, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Stock item not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update stock item" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getStockCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Stock item not found" });
    res.json({ message: "Stock item deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete stock item" });
  }
});

module.exports = router;
