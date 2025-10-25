const express = require("express");
const { ObjectId } = require("mongodb");
const { getBrandsCollection } = require("../db");
const router = express.Router();

function validateBrand(data) {
  if (!data.name) return "Brand name is required";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const collection = await getBrandsCollection();
    const items = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getBrandsCollection();
    const item = await collection.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: "Brand not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch brand" });
  }
});

router.post("/", async (req, res) => {
  const error = validateBrand(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getBrandsCollection();
    const newItem = {
      name: req.body.name,
      description: req.body.description || "",
      logo: req.body.logo || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...req.body
    };
    const result = await collection.insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add brand" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  const error = validateBrand(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getBrandsCollection();
    const updatedData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Brand not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update brand" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getBrandsCollection();
    const patchData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: patchData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Brand not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to patch brand" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getBrandsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Brand not found" });
    res.json({ message: "Brand deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete brand" });
  }
});

module.exports = router;
