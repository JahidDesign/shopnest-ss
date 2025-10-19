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
  sunglassesRoutes: require("./routes/sunglasses"),
  camerasRoutes: require("./routes/cameras"),
  makeUpRoutes: require("./routes/makeUp"),
  chilldsToyRoutes: require("./routes/chilldsToy"),
  categoriesRoutes: require("./routes/categories"),
  homebannersRoutes: require("./routes/homebanners"),
  blogPostRoutes: require("./routes/tours"),
  electronicsRoutes: require("./routes/electronics"),
  policiesuserRoutes: require("./routes/policiesuser"),
  claimsRoutes: require("./routes/claims"),
  subscribersRoutes: require("./routes/subscribers"),
  featureProductsRoutes: require("./routes/featureProducts"),
  bookProductsRoutes: require("./routes/bookProducts"),
  visitorRoutes: require("./routes/visitors"),
  customerRoutes: require("./routes/customers"),
  profiledesignRoutes: require("./routes/profiledesign"),
  usersRoutes: require("./routes/users"),
  policiesRoutes: require("./routes/policies"),
  createOrderRoutes: require("./routes/payments"),
   productsRoutes : require("./routes/products"),
   contactRoutes : require("./routes/contact"),
   HeroCarouselRoutes : require("./routes/HeroCarousel"),
   paymentsInsuranceRoutes : require("./routes/paymentsInsurance"),
  // loginUseRoutes : require("./routes/loginUse"),

};

// ✅ Connect DB first, then mount routes
connectDB()
  .then(() => {
    // Mount routes
    app.use("/sunglasses", routes.sunglassesRoutes);
    app.use("/makeUp", routes.makeUpRoutes);
    app.use("/cameras", routes.camerasRoutes);
    app.use("/chilldsToy", routes.chilldsToyRoutes);
     app.use("/categories", routes.categoriesRoutes);
    app.use("/homebanners", routes.homebannersRoutes);
    app.use("/blogpost", routes.blogPostRoutes);
    app.use("/electronics", routes.electronicsRoutes);
    app.use("/policiesuser", routes.policiesuserRoutes);
    app.use("/subscribers", routes.subscribersRoutes);
    app.use("/featureProducts", routes.featureProductsRoutes);
    app.use("/bookProducts", routes.bookProductsRoutes);
    app.use("/visitors", routes.visitorRoutes);
    app.use("/customer", routes.customerRoutes);
    app.use("/contact", routes.contactRoutes);
    app.use("/profiledesign", routes.profiledesignRoutes);
    app.use("/users", routes.usersRoutes);
    app.use("/policies", routes.policiesRoutes);
    app.use("/claims", routes.claimsRoutes);
    app.use("/payments", routes.createOrderRoutes);
    app.use("/products", routes.productsRoutes);
    app.use("/heroCarousel", routes.HeroCarouselRoutes);
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
