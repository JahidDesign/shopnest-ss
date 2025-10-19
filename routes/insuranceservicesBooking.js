const express = require("express");
const { ObjectId } = require("mongodb");
const { getInsuranceservicesBookingCollection } = require("../db");

const router = express.Router();

/* ===================== CREATE SERVICE ===================== */
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
    const result = await getInsuranceservicesBookingCollection().insertOne(newService);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===================== GET ALL SERVICES ===================== */
router.get("/", async (req, res) => {
  try {
    const services = await getInsuranceservicesBookingCollection().find().sort({ createdAt: -1 }).toArray();
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===================== GET SINGLE SERVICE ===================== */
router.get("/:id", async (req, res) => {
  try {
    const service = await getInsuranceservicesBookingCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===================== UPDATE SERVICE ===================== */
router.put("/:id", async (req, res) => {
  try {
    const result = await getInsuranceservicesBookingCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Service not found" });
    res.json({ success: true, message: "Service updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===================== DELETE SERVICE ===================== */
router.delete("/:id", async (req, res) => {
  try {
    const result = await getInsuranceservicesBookingCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Service not found" });
    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ===================== BOOK POLICY FROM BLOG MODAL ===================== */
router.post("/insuranceservicesBooking", async (req, res) => {
  try {
    const { blogId, blogTitle, userEmail, userName, age, gender, coverage, duration, smoker, estimatedPremium } = req.body;
    if (!blogId || !blogTitle || !userEmail || !age || !coverage || !duration || !estimatedPremium) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const newBooking = {
      blogId,
      blogTitle,
      userEmail,
      userName: userName || "Anonymous",
      age,
      gender: gender || "",
      coverage,
      duration,
      smoker: smoker || "No",
      estimatedPremium,
      createdAt: new Date(),
    };
    const result = await getInsuranceservicesBookingCollection().insertOne(newBooking);
    res.status(201).json({ success: true, id: result.insertedId, message: "Policy booked successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
