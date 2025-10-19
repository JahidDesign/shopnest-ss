const express = require("express");
const { ObjectId } = require("mongodb");
const { getBookInsuranceCollection } = require("../db");

const router = express.Router();

// CREATE SERVICE
router.post("/", async (req, res) => {
  try {
    const { serviceName, providerName, coverageAmount, premium, contactEmail, contactNumber, imageUrl, description } = req.body;
    if (!serviceName || !providerName) return res.status(400).json({ success: false, message: "Service name and provider name are required" });

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
      updatedAt: new Date(),
    };

    const collection = await getBookInsuranceCollection();
    const result = await collection.insertOne(newService);

    res.status(201).json({ success: true, message: "Service created", id: result.insertedId });
  } catch (err) {
    console.error("Create service error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET ALL SERVICES (WITH SEARCH & PAGINATION)
router.get("/", async (req, res) => {
  try {
    const collection = await getBookInsuranceCollection();
    const { page = 1, limit = 10, q = "" } = req.query;
    const pageNum = parseInt(page), limitNum = parseInt(limit);

    const searchFilter = q ? { $or: [
      { serviceName: { $regex: q, $options: "i" } },
      { providerName: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ] } : {};

    const total = await collection.countDocuments(searchFilter);
    const services = await collection.find(searchFilter).sort({ createdAt: -1 }).skip((pageNum-1)*limitNum).limit(limitNum).toArray();

    res.json({ success: true, page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total/limitNum), services });
  } catch (err) {
    console.error("Get all services error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET SINGLE SERVICE
router.get("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });

    const collection = await getBookInsuranceCollection();
    const service = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!service) return res.status(404).json({ success: false, message: "Service not found" });

    res.json({ success: true, service });
  } catch (err) {
    console.error("Get service error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// UPDATE SERVICE
router.put("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });

    const collection = await getBookInsuranceCollection();
    const result = await collection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: { ...req.body, updatedAt: new Date() } });

    if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Service not found" });

    res.json({ success: true, message: "Service updated" });
  } catch (err) {
    console.error("Update service error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// DELETE SERVICE
router.delete("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ID" });

    const collection = await getBookInsuranceCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Service not found" });

    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    console.error("Delete service error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// QUOTE ESTIMATOR
router.get("/quote/estimate", async (req, res) => {
  try {
    let { age, gender, coverageAmount, duration, smoker, page = 1, limit = 10 } = req.query;
    age = parseInt(age); coverageAmount = parseFloat(coverageAmount); duration = parseInt(duration);
    page = parseInt(page); limit = parseInt(limit);

    if (!age || !gender || !coverageAmount || !duration || !smoker) return res.status(400).json({ success: false, message: "All fields are required" });

    let baseRate = 0.02; // 2%
    if (age > 40) baseRate += 0.01;
    if (smoker.toLowerCase() === "yes") baseRate += 0.01;
    if (gender.toLowerCase() === "male") baseRate += 0.005;

    const annualPremium = coverageAmount * baseRate / 100;
    const monthlyPremium = annualPremium / 12;

    const collection = await getBookInsuranceCollection();
    const quoteRecord = { age, gender, coverageAmount, duration, smoker, annualPremium, monthlyPremium, createdAt: new Date() };
    await collection.insertOne(quoteRecord);

    const totalQuotes = await collection.countDocuments();
    const quotes = await collection.find().sort({ createdAt:-1 }).skip((page-1)*limit).limit(limit).toArray();

    res.json({ success:true, estimatedPremium:{ monthly: monthlyPremium.toFixed(2), annual: annualPremium.toFixed(2) }, quotes:{ page, limit, total: totalQuotes, totalPages: Math.ceil(totalQuotes/limit), data: quotes }, message: "Estimated premium calculated successfully" });
  } catch(err) {
    console.error("Quote error:", err);
    res.status(500).json({ success:false, message: "Internal server error" });
  }
});

module.exports = router;
