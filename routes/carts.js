const express = require("express");
const { ObjectId } = require("mongodb");
const { getCartsCollection } = require("../db");
const router = express.Router();

function validateCart(data) {
  if (!data.userId) return "User ID is required";
  if (!Array.isArray(data.items)) return "Items array is required";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const collection = await getCartsCollection();
    const items = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch carts" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getCartsCollection();
    const item = await collection.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: "Cart not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.post("/", async (req, res) => {
  const error = validateCart(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getCartsCollection();
    const newItem = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add cart" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  const error = validateCart(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getCartsCollection();
    const updatedData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Cart not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getCartsCollection();
    const patchData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: patchData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Cart not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to patch cart" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getCartsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Cart not found" });
    res.json({ message: "Cart deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete cart" });
  }
});

module.exports = router;
