// routes/categories.js
const express = require("express");
const { ObjectId } = require("mongodb");
const { getcategoriesCollection } = require("../db");

const router = express.Router();

// ✅ GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await getcategoriesCollection().find().toArray();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ✅ GET one category by ID
router.get("/:id", async (req, res) => {
  try {
    const category = await getcategoriesCollection().findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    console.error("Invalid ID:", error);
    res.status(400).json({ error: "Invalid category ID" });
  }
});

// ✅ CREATE a new category
router.post("/", async (req, res) => {
  try {
    const { title, image, link } = req.body;

    if (!title || !link) {
      return res
        .status(400)
        .json({ error: "Title and link are required." });
    }

    // image is optional
    const newCategory = {
      title: title.trim(),
      link: link.trim(),
      image: image || null,
      createdAt: new Date(),
    };

    const result = await getcategoriesCollection().insertOne(newCategory);

    res.status(201).json({ _id: result.insertedId, ...newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// ✅ UPDATE a category
router.put("/:id", async (req, res) => {
  try {
    const { title, image, link } = req.body;

    const result = await getcategoriesCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { title, link, image: image || null } }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Category not found" });

    res.json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(400).json({ error: "Failed to update category" });
  }
});

// ✅ DELETE a category
router.delete("/:id", async (req, res) => {
  try {
    const result = await getcategoriesCollection().deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Category not found" });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(400).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
