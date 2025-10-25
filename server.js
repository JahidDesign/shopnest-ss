// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import admin from "firebase-admin";
import rateLimit from "express-rate-limit";
import { connectDB } from "./db.js";

// ------------------- CHECK ENV -------------------
if (!process.env.JWT_SECRET || !process.env.STRIPE_SECRET_KEY || !process.env.ADMIN_EMAIL) {
  console.error("Missing environment variables. Please check your .env file!");
  process.exit(1);
}

// ------------------- INIT -------------------
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ------------------- MIDDLEWARE -------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prevent request timeouts
app.use((req, res, next) => {
  req.setTimeout(0);
  res.setTimeout(0);
  next();
});

// Rate limiter for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: "Too many requests. Please try again later." },
});

// ------------------- ROUTES -------------------
// Core ShopNest routes
const routes = {
  blogpost: "./routes/blogpost.js",
  products: "./routes/products.js",
  categories: "./routes/categories.js",
  subcategories: "./routes/subcategories.js",
  brands: "./routes/brands.js",
  featureProducts: "./routes/featureProducts.js",
  newproducts: "./routes/newproducts.js",
  hotproducts: "./routes/hotproducts.js",
  menproducts: "./routes/menproducts.js",
  womentproducts: "./routes/womentproducts.js",
  sportsproducts: "./routes/sportsproducts.js",
  smartphones: "./routes/smartphones.js",
  glosoryproducts: "./routes/glosoryproducts.js",
  electronics: "./routes/electronics.js",
  users: "./routes/users.js",
  customer: "./routes/customer.js",
  profiledesign: "./routes/profiledesign.js",
  orders: "./routes/orders.js",
  bookProducts: "./routes/bookProducts.js",
  stock: "./routes/stock.js",
  suppliers: "./routes/suppliers.js",
  flashSales: "./routes/flashSales.js",
  productVariants: "./routes/productVariants.js",
  reviews: "./routes/reviews.js",
  wishlists: "./routes/wishlists.js",
  carts: "./routes/carts.js",
  coupons: "./routes/coupons.js",
  shipping: "./routes/shipping.js",
  invoices: "./routes/invoices.js",
  homebanners: "./routes/homebanners.js",
  heroCarousel: "./routes/heroCarousel.js",
  homeproducts: "./routes/homeproducts.js",
  subscribers: "./routes/subscribers.js",
  visitors: "./routes/visitors.js",
  contact: "./routes/contact.js",
  sunglasses: "./routes/sunglasses.js",
  cameras: "./routes/cameras.js",
  makeUp: "./routes/makeUp.js",
  chilldsToy: "./routes/chilldsToy.js",
  tours: "./routes/tours.js",
  policies: "./routes/policies.js",
  policiesuser: "./routes/policiesuser.js",
  claims: "./routes/claims.js",
  payments: "./routes/payments.js",
};

// Dynamically import and mount all routes
for (const [path, routePath] of Object.entries(routes)) {
  const { default: router } = await import(routePath);
  app.use(`/${path}`, router);
}

// ------------------- AUTH -------------------
// Firebase login → JWT
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

// Admin-only route
app.delete("/admin/delete", (req, res) => {
  if (!req.user || req.user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }
  res.json({ message: "Admin deletion access granted" });
});

// ------------------- STRIPE PAYMENT -------------------
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

// ------------------- ROOT & 404 -------------------
app.get("/", (req, res) => {
  res.send("ShopNest API & Stripe Server is running successfully...");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found - ShopNest Server" });
});

// ------------------- GLOBAL ERROR HANDLER -------------------
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  res.status(500).json({ error: "Internal Server Error - ShopNest" });
});

// ------------------- START SERVER -------------------
try {
  await connectDB();
  app.listen(PORT, () => console.log(`ShopNest Server running at http://localhost:${PORT}`));
} catch (err) {
  console.error("Database connection failed:", err);
  process.exit(1);
}
