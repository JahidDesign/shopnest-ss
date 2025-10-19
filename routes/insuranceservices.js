// routes/insuranceServices.js
const express = require("express");
const { ObjectId } = require("mongodb");
const { getInsuranceServicesCollection } = require("../db");

const router = express.Router();

// Create service
router.post("/", async (req, res) => {
  try {
    const { serviceName, providerName, coverageAmount, premium, contactEmail, contactNumber, imageUrl, description } = req.body;

    if (!serviceName || !providerName) {
      return res.status(400).json({ success: false, message: "Service name and provider name are required" });
    }

    const newService = {
      serviceName,
      providerName,
      coverageAmount: coverageAmount || 0,
      premium: premium || 0,
      contactEmail: contactEmail || "",
      contactNumber: contactNumber || "",
      imageUrl: imageUrl || "",
      description: description || "",
      createdAt: new Date(),
    };

    const result = await getInsuranceServicesCollection().insertOne(newService);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all services
router.get("/", async (req, res) => {
  try {
    const services = await getInsuranceServicesCollection().find().sort({ createdAt: -1 }).toArray();
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single service by ID
router.get("/:id", async (req, res) => {
  try {
    const service = await getInsuranceServicesCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update service
router.put("/:id", async (req, res) => {
  try {
    const result = await getInsuranceServicesCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Service not found" });
    res.json({ success: true, message: "Service updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete service
router.delete("/:id", async (req, res) => {
  try {
    const result = await getInsuranceServicesCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Service not found" });
    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
