const express = require("express");
const { ObjectId } = require("mongodb");
const { getFlashSalesCollection } = require("../db");
const router = express.Router();

function validateFlashSale(data) {
  if (!data.productId) return "Product ID is required";
  if (!data.discount || isNaN(data.discount)) return "Discount is required";
  if (!data.startDate || !data.endDate) return "Start and end date are required";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const collection = await getFlashSalesCollection();
    const sales = await collection.find({}).sort({ startDate: -1 }).toArray();
    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch flash sales" });
  }
});

router.post("/", async (req, res) => {
  const error = validateFlashSale(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getFlashSalesCollection();
    const newSale = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(newSale);
    res.status(201).json({ ...newSale, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add flash sale" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getFlashSalesCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Flash sale not found" });
    res.json({ message: "Flash sale deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete flash sale" });
  }
});

module.exports = router;
