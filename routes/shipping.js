const express = require("express");
const { ObjectId } = require("mongodb");
const { getShippingCollection } = require("../db");
const router = express.Router();

function validateShipping(data) {
  if (!data.method) return "Shipping method is required";
  if (data.cost === undefined || isNaN(data.cost)) return "Shipping cost is required";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const collection = await getShippingCollection();
    const items = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shipping options" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getShippingCollection();
    const item = await collection.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: "Shipping option not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shipping option" });
  }
});

router.post("/", async (req, res) => {
  const error = validateShipping(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getShippingCollection();
    const newItem = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add shipping option" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  const error = validateShipping(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getShippingCollection();
    const updatedData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Shipping option not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update shipping option" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getShippingCollection();
    const patchData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: patchData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Shipping option not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to patch shipping option" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getShippingCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Shipping option not found" });
    res.json({ message: "Shipping option deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete shipping option" });
  }
});

module.exports = router;
