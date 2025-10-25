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
// Import all routes manually
import blogpostRoutes from "./routes/blogpost.js";
import productsRoutes from "./routes/products.js";
import categoriesRoutes from "./routes/categories.js";
import subcategoriesRoutes from "./routes/subcategories.js";
import brandsRoutes from "./routes/brands.js";
import featureProductsRoutes from "./routes/featureProducts.js";
import newproductsRoutes from "./routes/newproducts.js";
import hotproductsRoutes from "./routes/hotproducts.js";
import menproductsRoutes from "./routes/menproducts.js";
import womentproductsRoutes from "./routes/womentproducts.js";
import sportsproductsRoutes from "./routes/sportsproducts.js";
import smartphonesRoutes from "./routes/smartphones.js";
import glosoryproductsRoutes from "./routes/glosoryproducts.js";
import electronicsRoutes from "./routes/electronics.js";
import usersRoutes from "./routes/users.js";
import customerRoutes from "./routes/customer.js";
import profiledesignRoutes from "./routes/profiledesign.js";
import ordersRoutes from "./routes/orders.js";
import bookProductsRoutes from "./routes/bookProducts.js";
import stockRoutes from "./routes/stock.js";
import suppliersRoutes from "./routes/suppliers.js";
import flashSalesRoutes from "./routes/flashSales.js";
import productVariantsRoutes from "./routes/productVariants.js";
import reviewsRoutes from "./routes/reviews.js";
import wishlistsRoutes from "./routes/wishlists.js";
import cartsRoutes from "./routes/carts.js";
import couponsRoutes from "./routes/coupons.js";
import shippingRoutes from "./routes/shipping.js";
import invoicesRoutes from "./routes/invoices.js";
import homebannersRoutes from "./routes/homebanners.js";
import heroCarouselRoutes from "./routes/heroCarousel.js";
import homeproductsRoutes from "./routes/homeproducts.js";
import subscribersRoutes from "./routes/subscribers.js";
import visitorsRoutes from "./routes/visitors.js";
import contactRoutes from "./routes/contact.js";
import sunglassesRoutes from "./routes/sunglasses.js";
import camerasRoutes from "./routes/cameras.js";
import makeUpRoutes from "./routes/makeUp.js";
import chilldsToyRoutes from "./routes/chilldsToy.js";
import toursRoutes from "./routes/tours.js";
import policiesRoutes from "./routes/policies.js";
import policiesuserRoutes from "./routes/policiesuser.js";
import claimsRoutes from "./routes/claims.js";
import paymentsRoutes from "./routes/payments.js";

// ------------------- MOUNT ROUTES MANUALLY -------------------
app.use("/blogpost", blogpostRoutes);
app.use("/products", productsRoutes);
app.use("/categories", categoriesRoutes);
app.use("/subcategories", subcategoriesRoutes);
app.use("/brands", brandsRoutes);
app.use("/featureProducts", featureProductsRoutes);
app.use("/newproducts", newproductsRoutes);
app.use("/hotproducts", hotproductsRoutes);
app.use("/menproducts", menproductsRoutes);
app.use("/womentproducts", womentproductsRoutes);
app.use("/sportsproducts", sportsproductsRoutes);
app.use("/smartphones", smartphonesRoutes);
app.use("/glosoryproducts", glosoryproductsRoutes);
app.use("/electronics", electronicsRoutes);
app.use("/users", usersRoutes);
app.use("/customer", customerRoutes);
app.use("/profiledesign", profiledesignRoutes);
app.use("/orders", ordersRoutes);
app.use("/bookProducts", bookProductsRoutes);
app.use("/stock", stockRoutes);
app.use("/suppliers", suppliersRoutes);
app.use("/flashSales", flashSalesRoutes);
app.use("/productVariants", productVariantsRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/wishlists", wishlistsRoutes);
app.use("/carts", cartsRoutes);
app.use("/coupons", couponsRoutes);
app.use("/shipping", shippingRoutes);
app.use("/invoices", invoicesRoutes);
app.use("/homebanners", homebannersRoutes);
app.use("/heroCarousel", heroCarouselRoutes);
app.use("/homeproducts", homeproductsRoutes);
app.use("/subscribers", subscribersRoutes);
app.use("/visitors", visitorsRoutes);
app.use("/contact", contactRoutes);
app.use("/sunglasses", sunglassesRoutes);
app.use("/cameras", camerasRoutes);
app.use("/makeUp", makeUpRoutes);
app.use("/chilldsToy", chilldsToyRoutes);
app.use("/tours", toursRoutes);
app.use("/policies", policiesRoutes);
app.use("/policiesuser", policiesuserRoutes);
app.use("/claims", claimsRoutes);
app.use("/payments", paymentsRoutes);

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
