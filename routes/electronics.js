// routes/products.js
const express = require("express");
const { ObjectId } = require("mongodb");
const { getElectronicsCollection } = require("../db");

const router = express.Router();

/**
 * ✅ Validation function for frontend-friendly errors
 */
function validateProduct(data) {
  var errors = {};

  if (!data.name) {
    errors.name = "Product name is required";
  }

  if (!data.category) {
    errors.category = "Category is required";
  }

  if (!data.price || Number(data.price) <= 0) {
    errors.price = "Price must be a positive number";
  }

  if (data.hasDiscount) {
    if (data.discountPrice === undefined || data.discountPrice === "") {
      errors.discountPrice = "Discount price is required";
    } else if (Number(data.discountPrice) < 0) {
      errors.discountPrice = "Discount price cannot be negative";
    } else if (Number(data.discountPrice) >= Number(data.price)) {
      errors.discountPrice = "Discount price must be less than regular price";
    }
  }

  if (Object.keys(errors).length > 0) {
    return errors;
  } else {
    return null;
  }
}


/**
 * ✅ GET all products
 */
router.get("/", async (req, res) => {
  try {
    const products = await getElectronicsCollection()
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/**
 * ✅ GET single product by ID
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid ID" });

  try {
    const product = await getElectronicsCollection().findOne({
      _id: new ObjectId(id),
    });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

/**
 * ✅ POST new product (with user info)
 */
router.post("/", async (req, res) => {
  const error = validateProduct(req.body);
  if (error)
    return res.status(400).json({ message: "Validation failed", errors: error });

  try {
    const {
      name,
      image,
      price,
      hasDiscount,
      discountPrice,
      category,
      description,
      userName,
      userEmail,
      userPhone,
    } = req.body;

    const newProduct = {
      name,
      image: image || "",
      price: Number(price),
      hasDiscount: hasDiscount || false,
      discountPrice: discountPrice ? Number(discountPrice) : null,
      category,
      description,
      // ✅ User information
      user: {
        name: userName || "Anonymous",
        email: userEmail || "",
        phone: userPhone || "",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await getElectronicsCollection().insertOne(newProduct);

    res.status(201).json({
      message: "Product created successfully",
      productId: result.insertedId,
    });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
});

/**
 * ✅ PUT update product by ID (including user info update)
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid ID" });

  const error = validateProduct(req.body);
  if (error)
    return res.status(400).json({ message: "Validation failed", errors: error });

  try {
    const {
      name,
      image,
      price,
      hasDiscount,
      discountPrice,
      category,
      description,
      userName,
      userEmail,
      userPhone,
    } = req.body;

    const updatedProduct = {
      name,
      image: image || "",
      price: Number(price),
      hasDiscount: hasDiscount || false,
      discountPrice: discountPrice ? Number(discountPrice) : null,
      category,
      description,
      user: {
        name: userName || "Anonymous",
        email: userEmail || "",
        phone: userPhone || "",
      },
      updatedAt: new Date(),
    };

    const result = await getElectronicsCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedProduct },
      { returnDocument: "after" }
    );

    if (!result.value)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json({
      message: "Product updated successfully",
      product: result.value,
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: "Failed to update product" });
  }
});

/**
 * ✅ DELETE product by ID
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id))
    return res.status(400).json({ message: "Invalid ID" });

  try {
    const result = await getElectronicsCollection().deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

module.exports = router;
