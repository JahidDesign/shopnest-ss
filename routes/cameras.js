// routes/productsRoutes.js
const express = require("express");
const { ObjectId } = require("mongodb");
const {   getcamerasCollection } = require("../db");

const router = express.Router();

/**
 * Product Fields:
 * name, sku, brand, category, subcategory, price, hasDiscount,
 * discountPrice, discountStart, discountEnd, stock, status,
 * featured, weight, dimensions, description, images, tags,
 * variants, metaTitle, metaDescription, metaKeywords, relatedProducts,
 * rating (star rating 0-5)
 */

// ---------------- Validation ----------------
function validateProduct(data) {
  if (!data.name) return "Product name is required";
  if (!data.category) return "Category is required";
  if (data.price === undefined || data.price === null || data.price === "")
    return "Price is required";

  if (data.rating !== undefined && (data.rating < 0 || data.rating > 5))
    return "Rating must be between 0 and 5";

  return null; // no error
}

// ---------------- GET all products ----------------
// Supports optional query params: minRating, sortBy (price/rating), order (asc/desc)
router.get("/", async (req, res) => {
  try {
    const { minRating, sortBy, order } = req.query;
    const collection = await getcamerasCollection();

    const query = {};
    if (minRating !== undefined) query.rating = { $gte: Number(minRating) };

    const sortOptions = {};
    if (sortBy) {
      const sortOrder = order === "desc" ? -1 : 1;
      if (["price", "rating", "createdAt"].includes(sortBy)) sortOptions[sortBy] = sortOrder;
    } else {
      sortOptions.createdAt = -1; // default sort newest first
    }

    const products = await collection.find(query).sort(sortOptions).toArray();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// ---------------- GET single product ----------------
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid product ID" });

  try {
    const collection = await getcamerasCollection();
    const product = await collection.findOne({ _id: new ObjectId(id) });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// ---------------- POST: Create new product ----------------
router.post("/", async (req, res) => {
  const error = validateProduct(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const collection = await getcamerasCollection();

    const newProduct = {
      name: req.body.name || "",
      sku: req.body.sku || "",
      brand: req.body.brand || "",
      category: req.body.category || "",
      subcategory: req.body.subcategory || "",
      price: req.body.price || 0,
      hasDiscount: req.body.hasDiscount || false,
      discountPrice: req.body.discountPrice || 0,
      discountStart: req.body.discountStart || "",
      discountEnd: req.body.discountEnd || "",
      stock: req.body.stock || 0,
      status: req.body.status || "published",
      featured: req.body.featured || false,
      weight: req.body.weight || "",
      dimensions: req.body.dimensions || "",
      description: req.body.description || "",
      images: req.body.images || [],
      tags: req.body.tags || [],
      variants: req.body.variants || [],
      metaTitle: req.body.metaTitle || "",
      metaDescription: req.body.metaDescription || "",
      metaKeywords: req.body.metaKeywords || "",
      relatedProducts: req.body.relatedProducts || [],
      rating: req.body.rating !== undefined ? req.body.rating : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newProduct);
    res.status(201).json({ ...newProduct, _id: result.insertedId });
  } catch (err) {
    console.error("Error adding product:", err);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// ---------------- PUT: Full update ----------------
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid product ID" });

  const error = validateProduct(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const collection = await getcamerasCollection();
    const updatedData = { ...req.body, rating: req.body.rating || 0, updatedAt: new Date() };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Product not found" });
    res.json(result.value);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ---------------- PATCH: Partial update ----------------
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid product ID" });

  try {
    const collection = await getcamerasCollection();
    const patchData = { ...req.body };
    if (patchData.rating === undefined) patchData.rating = 0;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...patchData, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Product not found" });
    res.json(result.value);
  } catch (err) {
    console.error("Error patching product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// ---------------- DELETE ----------------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid product ID" });

  try {
    const collection = await getcamerasCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
