// File: server.js
// ShopNest Backend Server (Firebase + MongoDB + Stripe)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./db");

// Check essential environment variables
if (!process.env.JWT_SECRET || !process.env.STRIPE_SECRET_KEY || !process.env.ADMIN_EMAIL) {
  console.error("Missing environment variables. Please verify your .env configuration.");
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prevent request timeouts for heavy operations
app.use((req, res, next) => {
  req.setTimeout(0);
  res.setTimeout(0);
  next();
});

// Rate limiting (mainly for login & sensitive endpoints)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Too many requests. Please try again later." },
});

// Import all ShopNest routes
const routes = {
  // Core eCommerce collections
  blogpost: require("./routes/blogpost"),
  products: require("./routes/products"),
  categories: require("./routes/categories"),
  subcategories: require("./routes/subcategories"),
  brands: require("./routes/brands"),
  featureProducts: require("./routes/featureProducts"),
  newproducts: require("./routes/newproducts"),
  hotproducts: require("./routes/hotproducts"),
  menproducts: require("./routes/menproducts"),
  womentproducts: require("./routes/womentproducts"),
  sportsproducts: require("./routes/sportsproducts"),
  smartphones: require("./routes/smartphones"),
  glosoryproducts: require("./routes/glosoryproducts"),
  electronics: require("./routes/electronics"),

  // User and profile management
  users: require("./routes/users"),
  customer: require("./routes/customer"),
  profiledesign: require("./routes/profiledesign"),

  // Shop and order management
  orders: require("./routes/orders"),
  bookProducts: require("./routes/bookProducts"),
  stock: require("./routes/stock"),
  suppliers: require("./routes/suppliers"),
  flashSales: require("./routes/flashSales"),
  productVariants: require("./routes/productVariants"),

  // Customer interaction
  reviews: require("./routes/reviews"),
  wishlists: require("./routes/wishlists"),
  carts: require("./routes/carts"),
  coupons: require("./routes/coupons"),
  shipping: require("./routes/shipping"),
  invoices: require("./routes/invoices"),

  // Marketing and banners
  homebanners: require("./routes/homebanners"),
  heroCarousel: require("./routes/heroCarousel"),
  homeproducts: require("./routes/homeproducts"),
  subscribers: require("./routes/subscribers"),
  visitors: require("./routes/visitors"),
  contact: require("./routes/contact"),

  // Optional extras
  sunglasses: require("./routes/sunglasses"),
  cameras: require("./routes/cameras"),
  makeUp: require("./routes/makeUp"),
  chilldsToy: require("./routes/chilldsToy"),
  tours: require("./routes/tours"),

  // Business logic
  policies: require("./routes/policies"),
  policiesuser: require("./routes/policiesuser"),
  claims: require("./routes/claims"),

  // Payments
  payments: require("./routes/payments"),
};

// Dynamically mount all routes
for (const [path, router] of Object.entries(routes)) {
  app.use(`/${path}`, router);
}

// ------------------ AUTHENTICATION ------------------

// Firebase login → JWT token generation
app.post("/customer/login", authLimiter, async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ success: false, error: "Missing idToken" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const payload = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, token, user: payload });
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    res.status(401).json({ success: false, error: "Invalid Firebase ID token" });
  }
});

// Example protected route
app.get("/customer/protected", (req, res) => {
  res.json({ success: true, message: "Protected ShopNest route", user: req.user || null });
});

// Example admin-only route
app.delete("/admin/delete", (req, res) => {
  if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }
  res.json({ message: "Admin deletion access granted" });
});

// ------------------ STRIPE PAYMENT ------------------
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
    console.error("Stripe Payment Error:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// ------------------ ROOT & 404 ------------------
app.get("/", (req, res) => {
  res.send("ShopNest API & Stripe Payment Server is running successfully...");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found - ShopNest Server" });
});

// ------------------ GLOBAL ERROR HANDLER ------------------
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  res.status(500).json({ error: "Internal Server Error - ShopNest" });
});

// ------------------ START SERVER ------------------
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`ShopNest Server running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });
