const express = require("express");
const { ObjectId } = require("mongodb");
const { getInvoicesCollection } = require("../db");
const router = express.Router();

function validateInvoice(data) {
  if (!data.customerId) return "Customer ID is required";
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) return "Invoice items are required";
  if (!data.total || isNaN(data.total)) return "Total amount is required";
  return null;
}

router.get("/", async (req, res) => {
  try {
    const collection = await getInvoicesCollection();
    const invoices = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getInvoicesCollection();
    const invoice = await collection.findOne({ _id: new ObjectId(id) });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

router.post("/", async (req, res) => {
  const error = validateInvoice(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getInvoicesCollection();
    const newInvoice = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const result = await collection.insertOne(newInvoice);
    res.status(201).json({ ...newInvoice, _id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add invoice" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  const error = validateInvoice(req.body);
  if (error) return res.status(400).json({ error });
  try {
    const collection = await getInvoicesCollection();
    const updatedData = { ...req.body, updatedAt: new Date() };
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: "after" }
    );
    if (!result.value) return res.status(404).json({ error: "Invoice not found" });
    res.json(result.value);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
  try {
    const collection = await getInvoicesCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

module.exports = router;
