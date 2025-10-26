const express = require("express");
const { ObjectId } = require("mongodb");
const { getCarouselCollection } = require("../db");
const router = express.Router();

// ✅ Validate carousel/banner data
function validateBanner(data) {
  if (!data.image) return "Image URL is required.";
  if (!data.title) return "Title is required.";
  if (!data.subtitle) return "Subtitle is required.";
  return null;
}

// ✅ GET all carousel banners
router.get("/", async (req, res) => {
  try {
    const collection = await getCarouselCollection();
    const banners = await collection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(banners);
  } catch (err) {
    console.error("Error fetching banners:", err);
    res.status(500).json({ error: "Failed to fetch carousel banners." });
  }
});

// ✅ POST a new banner
router.post("/", async (req, res) => {
  const error = validateBanner(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const collection = await getCarouselCollection();
    const newBanner = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await collection.insertOne(newBanner);
    res.status(201).json({ ...newBanner, _id: result.insertedId });
  } catch (err) {
    console.error("Error adding banner:", err);
    res.status(500).json({ error: "Failed to add carousel banner." });
  }
});

// ✅ DELETE a banner by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id))
    return res.status(400).json({ error: "Invalid banner ID." });

  try {
    const collection = await getCarouselCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Banner not found." });

    res.json({ message: "Banner deleted successfully." });
  } catch (err) {
    console.error("Error deleting banner:", err);
    res.status(500).json({ error: "Failed to delete banner." });
  }
});

module.exports = router;
