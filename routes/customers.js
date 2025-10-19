const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getCustomerCollection } = require("../db");

const router = express.Router();

// ---------------- JWT Config ----------------
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "fa939a8bb3acbcf74b2aa4163a41897ea04ce9ab9c24d472413cbe027d1037fe3c4f801c9968db0e62e4705ffac1bd6cb795834099b21c6df9a5424a376b7919";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ---------------- Multer Setup ----------------
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------------- Helpers ----------------
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

function buildUserQuery(id) {
  if (ObjectId.isValid(id)) {
    return { _id: new ObjectId(id) };
  }
  return { uid: id }; // fallback to Firebase UID
}

// ---------------- Routes ----------------

// ===== CREATE USER =====
router.post("/", async (req, res) => {
  try {
    const { uid, name, email, password, photo, phone, role, status } = req.body;
    if (!uid || !name || !email || !password)
      return res.status(400).json({ error: "Missing required fields." });

    const customers = await getCustomerCollection();
    const existing = await customers.findOne({ email });
    if (existing) return res.status(409).json({ error: "User already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      uid,
      name,
      email,
      password: hashedPassword,
      photo: photo || "",
      phone: phone || "",
      role: role || "customer",
      status: status || "active",
      createdAt: new Date(),
    };

    const result = await customers.insertOne(newUser);
    res.status(201).json({ message: "User created", id: result.insertedId });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== LOGIN USER =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required." });

    const customers = await getCustomerCollection();
    const user = await customers.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ error: "Invalid credentials." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password." });

    const token = signToken(user);
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== GOOGLE LOGIN =====
router.post("/google-login", async (req, res) => {
  try {
    const { uid, email, name, photo } = req.body;
    if (!uid || !email)
      return res.status(400).json({ error: "UID and email required." });

    const customers = await getCustomerCollection();
    let user = await customers.findOne({ email });

    if (!user) {
      const newUser = {
        uid,
        name: name || "Google User",
        email,
        photo: photo || "",
        phone: "",
        role: "customer",
        status: "active",
        createdAt: new Date(),
      };
      const result = await customers.insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
    }

    const token = signToken(user);
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== READ ALL =====
router.get("/", async (req, res) => {
  try {
    const customers = await getCustomerCollection();
    const users = await customers.find({}).toArray();
    res.json(users.map(sanitizeUser));
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== READ ALL (Paginated + Search + Filter) =====
router.get("/paginated", async (req, res) => {
  try {
    const customers = await getCustomerCollection();

    const {
      page = 1,
      limit = 10,
      search = "",
      role,
      status,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      customers.find(query).skip(skip).limit(parseInt(limit)).toArray(),
      customers.countDocuments(query),
    ]);

    res.json({
      users: users.map(sanitizeUser),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Get paginated users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== READ ONE =====
router.get("/:id", async (req, res) => {
  try {
    const customers = await getCustomerCollection();
    const user = await customers.findOne(buildUserQuery(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(sanitizeUser(user));
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== UPDATE USER =====
router.put("/:id", upload.single("photo"), async (req, res) => {
  try {
    const { name, email, password, phone, role, status } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (req.file) updateData.photo = `/uploads/${req.file.filename}`;

    const customers = await getCustomerCollection();
    const result = await customers.findOneAndUpdate(
      buildUserQuery(req.params.id),
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated", user: sanitizeUser(result.value) });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== PATCH ROLE =====
router.patch("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: "Role is required" });

    const customers = await getCustomerCollection();
    const result = await customers.findOneAndUpdate(
      buildUserQuery(req.params.id),
      { $set: { role } },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Role updated", user: sanitizeUser(result.value) });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== PATCH STATUS =====
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    const customers = await getCustomerCollection();
    const result = await customers.findOneAndUpdate(
      buildUserQuery(req.params.id),
      { $set: { status } },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "User not found" });
    res.json({ message: "Status updated", user: sanitizeUser(result.value) });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== DELETE USER =====
router.delete("/:id", async (req, res) => {
  try {
    const customers = await getCustomerCollection();
    const result = await customers.deleteOne(buildUserQuery(req.params.id));
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
