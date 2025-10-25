const express = require("express");
const { ObjectId } = require("mongodb");
const { getSuppliersCollection } = require("../db");
const router = express.Router();

function validateSupplier(data) {
  if (!data.name) return "Supplier name is required";
  if (!data.contact) return "Contact info is required";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const collection = await getSuppliersCollection();
    const suppliers = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(suppliers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

router.post("/", async (req, res) => {
  const error = validateSupplier(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getSuppliersCollection();
    const newSupplier = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(newSupplier);
    res.status(201).json({ ...newSupplier, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add supplier" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  const error = validateSupplier(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getSuppliersCollection();
    const updatedData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Supplier not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update supplier" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getSuppliersCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Supplier not found" });
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete supplier" });
  }
});

module.exports = router;
