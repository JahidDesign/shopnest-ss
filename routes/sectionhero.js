// File: routes/heroCarousel.js
const express = require("express");
const { ObjectId } = require("mongodb");
const { getHeroCarouselCollection } = require("../db");

const router = express.Router();

/**
 * @route   GET /
 * @desc    Get all hero carousel items
 */
router.get("/", async (req, res) => {
  try {
    const carousels = await getHeroCarouselCollection().find().toArray();
    res.status(200).json(carousels);
  } catch (error) {
    console.error("Error fetching carousel items:", error);
    res.status(500).json({ error: "Failed to fetch carousel items" });
  }
});

/**
 * @route   GET /:id
 * @desc    Get a single hero carousel item by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const carousel = await getHeroCarouselCollection().findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!carousel) {
      return res.status(404).json({ error: "Carousel item not found" });
    }

    res.status(200).json(carousel);
  } catch (error) {
    console.error("Invalid carousel ID:", error);
    res.status(400).json({ error: "Invalid carousel ID" });
  }
});

/**
 * @route   POST /
 * @desc    Add a new hero carousel item
 */
router.post("/", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body is empty" });
    }

    const result = await getHeroCarouselCollection().insertOne(req.body);
    res
      .status(201)
      .json({ message: "Carousel item created", insertedId: result.insertedId });
  } catch (error) {
    console.error("Failed to create carousel item:", error);
    res.status(500).json({ error: "Failed to create carousel item" });
  }
});

/**
 * @route   PUT /:id
 * @desc    Update an existing hero carousel item
 */
router.put("/:id", async (req, res) => {
  try {
    const result = await getHeroCarouselCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { upsert: false }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Carousel item not found" });
    }

    res.status(200).json({ message: "Carousel item updated successfully" });
  } catch (error) {
    console.error("Failed to update carousel item:", error);
    res.status(400).json({ error: "Failed to update carousel item" });
  }
});

/**
 * @route   DELETE /:id
 * @desc    Delete a hero carousel item
 */
router.delete("/:id", async (req, res) => {
  try {
    const result = await getHeroCarouselCollection().deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Carousel item not found" });
    }

    res.status(200).json({ message: "Carousel item deleted successfully" });
  } catch (error) {
    console.error("Failed to delete carousel item:", error);
    res.status(400).json({ error: "Failed to delete carousel item" });
  }
});

module.exports = router;
