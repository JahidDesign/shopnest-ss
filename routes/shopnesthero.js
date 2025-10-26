// routes/blogPost.js
import express from "express";
import { ObjectId } from "mongodb";
import { getBlogPostCollection } from "../db.js";

const router = express.Router();

/**
 * ✅ GET /blog
 * Get all blog posts
 */
router.get("/", async (req, res) => {
  try {
    const blogs = await getBlogPostCollection().find().sort({ _id: -1 }).toArray();
    res.status(200).json(blogs);
  } catch (err) {
    console.error("❌ Failed to fetch blogs:", err);
    res.status(500).json({ error: "Failed to fetch blog posts" });
  }
});

/**
 * ✅ GET /blog/:id
 * Get a single blog post by ID and increment view count
 */
router.get("/:id", async (req, res) => {
  try {
    const blogId = req.params.id;
    const collection = getBlogPostCollection();

    // Increment view count
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(blogId) },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Blog post not found" });
    res.status(200).json(result.value);
  } catch (err) {
    console.error("❌ Failed to fetch blog post:", err);
    res.status(400).json({ error: "Invalid blog ID" });
  }
});

/**
 * ✅ POST /blog
 * Create a new blog post
 * Required fields: image, title, link, description
 */
router.post("/", async (req, res) => {
  try {
    const { image, title, link, description } = req.body;

    if (!image || !title || !link || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const blogData = {
      image,
      title,
      link,
      description,
      views: 0,
      createdAt: new Date(),
    };

    const result = await getBlogPostCollection().insertOne(blogData);
    res.status(201).json({
      message: "✅ Blog post created successfully",
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.error("❌ Failed to create blog post:", err);
    res.status(400).json({ error: "Failed to create blog post" });
  }
});

/**
 * ✅ PUT /blog/:id
 * Update a blog post
 */
router.put("/:id", async (req, res) => {
  try {
    const blogId = req.params.id;
    const updateData = req.body;

    const result = await getBlogPostCollection().updateOne(
      { _id: new ObjectId(blogId) },
      { $set: updateData },
      { upsert: false }
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Blog post not found" });

    res.status(200).json({ message: "✅ Blog post updated successfully" });
  } catch (err) {
    console.error("❌ Failed to update blog post:", err);
    res.status(400).json({ error: "Failed to update blog post" });
  }
});

/**
 * ✅ DELETE /blog/:id
 * Delete a blog post
 */
router.delete("/:id", async (req, res) => {
  try {
    const blogId = req.params.id;
    const result = await getBlogPostCollection().deleteOne({
      _id: new ObjectId(blogId),
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Blog post not found" });

    res.status(200).json({ message: "🗑️ Blog post deleted successfully" });
  } catch (err) {
    console.error("❌ Failed to delete blog post:", err);
    res.status(400).json({ error: "Failed to delete blog post" });
  }
});

/**
 * ✅ PATCH /blog/:id/views
 * Increment only the visitor (view) count
 */
router.patch("/:id/views", async (req, res) => {
  try {
    const blogId = req.params.id;
    const result = await getBlogPostCollection().findOneAndUpdate(
      { _id: new ObjectId(blogId) },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!result.value)
      return res.status(404).json({ error: "Blog post not found" });

    res.status(200).json({
      message: "👁️ View count incremented",
      views: result.value.views,
    });
  } catch (err) {
    console.error("❌ Failed to increment views:", err);
    res.status(400).json({ error: "Invalid blog ID" });
  }
});

export default router;
