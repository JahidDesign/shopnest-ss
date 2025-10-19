const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { getCustomerCollection } = require("../db");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Sign JWT
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Remove password
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

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
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== LOGIN USER =====
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required." });

    const customers = await getCustomerCollection();
    const user = await customers.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ error: "Invalid credentials." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password." });

    const token = signToken(user);
    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== GOOGLE LOGIN =====
router.post("/google-login", async (req, res) => {
  try {
    const { uid, email, name, photo } = req.body;
    if (!uid || !email) return res.status(400).json({ error: "UID and email required." });

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
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== READ ONE =====
router.get("/:id", async (req, res) => {
  try {
    const customers = await getCustomerCollection();
    const user = await customers.findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(sanitizeUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== UPDATE USER =====
router.put("/:id", async (req, res) => {
  try {
    const { name, email, password, photo, phone, role, status } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (photo) updateData.photo = photo;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const customers = await getCustomerCollection();
    const result = await customers.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated", user: sanitizeUser(result.value) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== DELETE USER =====
router.delete("/:id", async (req, res) => {
  try {
    const customers = await getCustomerCollection();
    const result = await customers.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
const admin = require("firebase-admin");
const { connectDB } = require("./db");
const authenticateToken = require("./middleware/authenticateToken");
const rateLimit = require("express-rate-limit");

if (!process.env.JWT_SECRET || !process.env.STRIPE_SECRET_KEY || !process.env.ADMIN_EMAIL) {
  console.error("❌ Missing environment variables. Check .env file.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  req.setTimeout(0);
  res.setTimeout(0);
  next();
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Please try again later." },
});

// ✅ Require all routes properly
const routes = {
  managementRoutes: require("./routes/management"),
  blogPostRoutes: require("./routes/tours"),
  policiesuserRoutes: require("./routes/policiesuser"),
  insuranceservicesRoutes: require("./routes/insuranceservices"),
  visitorRoutes: require("./routes/visitors"),
  customerRoutes: require("./routes/customers"),
  profiledesignRoutes: require("./routes/profiledesign"),
  usersRoutes: require("./routes/users"),
  policiesRoutes: require("./routes/policies"),
  createOrderRoutes: require("./routes/payments"),
   InsuranceCarouselRoutes : require("./routes/InsuranceCarousel"),
   contactRoutes : require("./routes/contact"),
   HeroCarouselRoutes : require("./routes/HeroCarousel"),
   paymentsInsuranceRoutes : require("./routes/paymentsInsurance"),
  // loginUseRoutes : require("./routes/loginUse"),

};

// ✅ Connect DB first, then mount routes
connectDB()
  .then(() => {
    // Mount routes
    app.use("/management", routes.managementRoutes);
    app.use("/blogpost", routes.blogPostRoutes);
    app.use("/policiesuser", routes.policiesuserRoutes);
    app.use("/insuranceservices", routes.insuranceservicesRoutes);
    app.use("/visitors", routes.visitorRoutes);
    app.use("/customer", routes.customerRoutes);
    app.use("/contact", routes.contactRoutes);
    app.use("/profiledesign", routes.profiledesignRoutes);
    app.use("/users", routes.usersRoutes);
    app.use("/policies", routes.policiesRoutes);
    app.use("/payments", routes.createOrderRoutes);
    app.use("/InsuranceCarousel", routes.InsuranceCarouselRoutes);
    app.use("/HeroCarousel", routes.HeroCarouselRoutes);
    app.use("/paymentsInsurance", routes.paymentsInsuranceRoutes);
    // app.use("/register", loginUseRoutes);
    // Firebase login → JWT
    app.post("/customer/login", authLimiter, async (req, res) => {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ success: false, error: "idToken missing" });

      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const payload = { uid: decodedToken.uid, email: decodedToken.email, name: decodedToken.name || decodedToken.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ success: true, token, user: payload });
      } catch (error) {
        console.error("Firebase ID token verification error:", error);
        res.status(401).json({ success: false, error: "Invalid Firebase ID token" });
      }
    });

    // Stripe payment intent
    app.post("/create-payment-intent", authLimiter, async (req, res) => {
      const { amount } = req.body;
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Stripe error:", error);
        res.status(500).json({ error: "Failed to create payment intent" });
      }
    });

    // Protected route
    app.get("/customer/protected", (req, res) => {
      res.json({ success: true, message: "Protected content", user: req.user });
    });

    // Admin-only route
    app.delete("/admin/delete", (req, res) => {
      if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ error: "Access denied: Admin only" });
      }
      res.json({ message: "Admin deletion access granted" });
    });

    // Root & 404
    app.get("/", (req, res) => res.send("✅ Insurance & Stripe API is running..."));
    app.use((req, res) => res.status(404).json({ error: "Route not found" }));

    // Global error handler
    app.use((err, req, res, next) => {
      console.error("Server Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    });

    // Start server after DB is ready
    app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });

