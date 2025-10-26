// db.js
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// MongoDB Connection URI
const uri = `mongodb+srv://shopMasterDB:2kagMrVmD10p3VgK@cluster0.hyltisu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Client Setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

// ==========================
// ✅ Core Collections
// ==========================
let sunglassesCollection;
let makeUpCollection;
let CarouselCollection;
let electronicsCollection;
let airTicketCollection;
let featureProductsCollection;
let visitorsCollection;
let customerCollection;
let contactCollection;
let profileDesignCollection;
let usersCollection;
let policiesCollection;
let registerCollection;
let subscribersCollection;
let categoriesCollection;
let createOrderCollection;
let ProductsCollection;
let claimsCollection;
let homebannersCollection;
let camerasCollection;
let homeproductsCollection;
let chilldsToyCollection;
let bookInsuranceCollection;
let HeroCarouselCollection;
let paymentsCollection;
let toursCollection;

// ==========================
// ✅ New / Product Collections
// ==========================
let smartphonesCollection;
let sportsproductsCollection;
let newproductsCollection;
let menproductsCollection;
let hotproductsCollection;
let womentproductsCollection;
let glosoryproductsCollection;

// ==========================
// ✅ Optional / eCommerce Collections
// ==========================
let brandsCollection;
let subcategoriesCollection;
let tagsCollection;
let reviewsCollection;
let wishlistsCollection;
let cartsCollection;
let couponsCollection;
let shippingCollection;
let invoicesCollection;
let stockCollection;
let suppliersCollection;
let flashSalesCollection;
let productVariantsCollection;

// ==========================
// 🔗 Database Connection
// ==========================
async function connectDB() {
  try {
    await client.connect();
    db = client.db("shopMasterDB");

    // Core collections
    toursCollection = db.collection("tours");
    categoriesCollection = db.collection("categories");
    camerasCollection = db.collection("cameras");
    makeUpCollection = db.collection("makeUp");
    sunglassesCollection = db.collection("sunglasses");
    CarouselCollection = db.collection("carouselRoutes");
    electronicsCollection = db.collection("electronics");
    airTicketCollection = db.collection("policiesuser");
    featureProductsCollection = db.collection("featureProducts");
    homeproductsCollection = db.collection("homeproducts");
    chilldsToyCollection = db.collection("chilldsToy");
    bookInsuranceCollection = db.collection("bookProducts");
    visitorsCollection = db.collection("visitors");
    customerCollection = db.collection("customer");
    contactCollection = db.collection("contact");
    profileDesignCollection = db.collection("profiledesign");
    usersCollection = db.collection("users");
    policiesCollection = db.collection("policies");
    claimsCollection = db.collection("claims");
    subscribersCollection = db.collection("subscribers");
    homebannersCollection = db.collection("homebanners");
    createOrderCollection = db.collection("orders");
    ProductsCollection = db.collection("products");
    HeroCarouselCollection = db.collection("sectionhero");
    paymentsCollection = db.collection("payments");
    registerCollection = db.collection("register");

    // Product collections
    smartphonesCollection = db.collection("smartphones");
    sportsproductsCollection = db.collection("sportsproducts");
    newproductsCollection = db.collection("newproducts");
    menproductsCollection = db.collection("menproducts");
    hotproductsCollection = db.collection("hotproducts");
    womentproductsCollection = db.collection("womentproducts");
    glosoryproductsCollection = db.collection("glosoryproducts");

    // Optional / eCommerce collections
    brandsCollection = db.collection("brands");
    subcategoriesCollection = db.collection("subcategories");
    tagsCollection = db.collection("tags");
    reviewsCollection = db.collection("reviews");
    wishlistsCollection = db.collection("wishlists");
    cartsCollection = db.collection("carts");
    couponsCollection = db.collection("coupons");
    shippingCollection = db.collection("shipping");
    invoicesCollection = db.collection("invoices");
    stockCollection = db.collection("stock");
    suppliersCollection = db.collection("suppliers");
    flashSalesCollection = db.collection("flashSales");
    productVariantsCollection = db.collection("productVariants");

    console.log("✅ ShopNest server connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to ShopNest Server:", error);
    process.exit(1);
  }
}

// ==========================
// 🧩 Helper: Safe Getter
// ==========================
function check(collection, name) {
  if (!collection) throw new Error(`${name} collection not initialized.`);
  return collection;
}

// ==========================
// 📦 Getter Functions
// ==========================

// Core
function getToursCollection() { return check(toursCollection, "tours"); }
function getSunglassesCollection() { return check(sunglassesCollection, "sunglasses"); }
function getMakeUpCollection() { return check(makeUpCollection, "makeUp"); }
function getCarouselCollection() { return check(CarouselCollection, "carouselRoutes"); }
function getElectronicsCollection() { return check(electronicsCollection, "electronics"); }
function getAirTicketCollection() { return check(airTicketCollection, "policiesuser"); }
function getFeatureProductsCollection() { return check(featureProductsCollection, "featureProducts"); }
function getVisitorsCollection() { return check(visitorsCollection, "visitors"); }
function getCustomerCollection() { return check(customerCollection, "customer"); }
function getContactCollection() { return check(contactCollection, "contact"); }
function getProfileDesignCollection() { return check(profileDesignCollection, "profiledesign"); }
function getUsersCollection() { return check(usersCollection, "users"); }
function getPoliciesCollection() { return check(policiesCollection, "policies"); }
function getRegisterCollection() { return check(registerCollection, "register"); }
function getSubscribersCollection() { return check(subscribersCollection, "subscribers"); }
function getCategoriesCollection() { return check(categoriesCollection, "categories"); }
function getCreateOrderCollection() { return check(createOrderCollection, "orders"); }
function getProductsCollection() { return check(ProductsCollection, "products"); }
function getClaimsCollection() { return check(claimsCollection, "claims"); }
function getHomeBannersCollection() { return check(homebannersCollection, "homebanners"); }
function getCamerasCollection() { return check(camerasCollection, "cameras"); }
function getHomeProductsCollection() { return check(homeproductsCollection, "homeproducts"); }
function getChilldsToyCollection() { return check(chilldsToyCollection, "chilldsToy"); }
function getBookInsuranceCollection() { return check(bookInsuranceCollection, "bookProducts"); }
function getHeroCarouselCollection() { return check(HeroCarouselCollection, "sectionhero"); }
function getPaymentCollection() { return check(paymentsCollection, "payments"); }

// Product
function getSmartphonesCollection() { return check(smartphonesCollection, "smartphones"); }
function getSportsProductsCollection() { return check(sportsproductsCollection, "sportsproducts"); }
function getNewProductsCollection() { return check(newproductsCollection, "newproducts"); }
function getMenProductsCollection() { return check(menproductsCollection, "menproducts"); }
function getHotProductsCollection() { return check(hotproductsCollection, "hotproducts"); }
function getWomenProductsCollection() { return check(womentproductsCollection, "womentproducts"); }
function getGlosoryProductsCollection() { return check(glosoryproductsCollection, "glosoryproducts"); }

// Optional / eCommerce
function getBrandsCollection() { return check(brandsCollection, "brands"); }
function getSubcategoriesCollection() { return check(subcategoriesCollection, "subcategories"); }
function getTagsCollection() { return check(tagsCollection, "tags"); }
function getReviewsCollection() { return check(reviewsCollection, "reviews"); }
function getWishlistsCollection() { return check(wishlistsCollection, "wishlists"); }
function getCartsCollection() { return check(cartsCollection, "carts"); }
function getCouponsCollection() { return check(couponsCollection, "coupons"); }
function getShippingCollection() { return check(shippingCollection, "shipping"); }
function getInvoicesCollection() { return check(invoicesCollection, "invoices"); }
function getStockCollection() { return check(stockCollection, "stock"); }
function getSuppliersCollection() { return check(suppliersCollection, "suppliers"); }
function getFlashSalesCollection() { return check(flashSalesCollection, "flashSales"); }
function getProductVariantsCollection() { return check(productVariantsCollection, "productVariants"); }

// ==========================
// 🚀 Exports
// ==========================
module.exports = {
  connectDB,

  // Core
  getSunglassesCollection,
  getMakeUpCollection,
  getCarouselCollection,
  getElectronicsCollection,
  getAirTicketCollection,
  getFeatureProductsCollection,
  getVisitorsCollection,
  getCustomerCollection,
  getContactCollection,
  getProfileDesignCollection,
  getUsersCollection,
  getPoliciesCollection,
  getRegisterCollection,
  getSubscribersCollection,
  getCategoriesCollection,
  getCreateOrderCollection,
  getProductsCollection,
  getClaimsCollection,
  getHomeBannersCollection,
  getCamerasCollection,
  getHomeProductsCollection,
  getChilldsToyCollection,
  getBookInsuranceCollection,
  getHeroCarouselCollection,
  getPaymentCollection,
  getToursCollection,

  // Product
  getSmartphonesCollection,
  getSportsProductsCollection,
  getNewProductsCollection,
  getMenProductsCollection,
  getHotProductsCollection,
  getWomenProductsCollection,
  getGlosoryProductsCollection,

  // Optional / eCommerce
  getBrandsCollection,
  getSubcategoriesCollection,
  getTagsCollection,
  getReviewsCollection,
  getWishlistsCollection,
  getCartsCollection,
  getCouponsCollection,
  getShippingCollection,
  getInvoicesCollection,
  getStockCollection,
  getSuppliersCollection,
  getFlashSalesCollection,
  getProductVariantsCollection,
};
