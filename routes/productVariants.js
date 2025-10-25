const express = require("express");
const { ObjectId } = require("mongodb");
const { getProductVariantsCollection } = require("../db");
const router = express.Router();

function validateVariant(data) {
  if (!data.productId) return "Product ID is required";
  if (!data.name) return "Variant name is required";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const collection = await getProductVariantsCollection();
    const variants = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(variants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch variants" });
  }
});

router.post("/", async (req, res) => {
  const error = validateVariant(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getProductVariantsCollection();
    const newVariant = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(newVariant);
    res.status(201).json({ ...newVariant, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add variant" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getProductVariantsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Variant not found" });
    res.json({ message: "Variant deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete variant" });
  }
});

module.exports = router;
