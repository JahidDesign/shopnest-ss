// db.js
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.hyltisu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
let sunglassesCollection;
let makeUpCollection;
let blogPostCollection;
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
let chilldsToyCollection;
let bookInsuranceCollection;
let HeroCarouselCollection;
let paymentsInsuranceCollection;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("shopMasterDB");

    categoriesCollection = db.collection("categories");
    camerasCollection = db.collection("cameras");
    makeUpCollection = db.collection("makeUp");
    sunglassesCollection = db.collection("sunglasses");
    blogPostCollection = db.collection("blogpost");
    electronicsCollection = db.collection("electronics");
    airTicketCollection = db.collection("policiesuser");
    featureProductsCollection = db.collection("featureProducts");
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
    createOrderCollection = db.collection("payments");
    ProductsCollection = db.collection("products");
    HeroCarouselCollection = db.collection("heroCarousel");
    paymentsInsuranceCollection = db.collection("paymentsInsurance");

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Export getter functions with proper checks and fixed naming
function getmakeUpCollection() {
  if (!makeUpCollection) throw new Error("Management collection not initialized.");
  return makeUpCollection;
}
function gethomebannersCollection() {
  if (!homebannersCollection) throw new Error("Management collection not initialized.");
  return homebannersCollection;
}
function getcamerasCollection() {
  if (!camerasCollection) throw new Error("Management collection not initialized.");
  return camerasCollection;
}
function getcategoriesCollection() {
  if (!categoriesCollection) throw new Error("Management collection not initialized.");
  return categoriesCollection;
}
function getClaimsCollection() {
  if (!claimsCollection) throw new Error("Management collection not initialized.");
  return claimsCollection;
}
function getSubscribersCollection() {
  if (!subscribersCollection) throw new Error("Management collection not initialized.");
  return subscribersCollection;
}
function getsunglassesCollection() {
  if (!sunglassesCollection) throw new Error("Management collection not initialized.");
  return sunglassesCollection;
}

function getBlogPostCollection() {
  if (!blogPostCollection) throw new Error("BlogPost collection not initialized.");
  return blogPostCollection;
}
function getelectronicsCollection() {
  if (!electronicsCollection) throw new Error("BlogPost collection not initialized.");
  return electronicsCollection;
}

function getAirTicketCollection() {
  if (!airTicketCollection) throw new Error("AirTicket collection not initialized.");
  return airTicketCollection;
}

function getfeatureProductsCollection() {
  if (!featureProductsCollection) throw new Error("InsuranceServices collection not initialized.");
  return featureProductsCollection;
}
function getchilldsToyCollection() {
  if (!chilldsToyCollection) throw new Error("InsuranceServices collection not initialized.");
  return chilldsToyCollection;
}
function getBookInsuranceCollection() {
  if (!bookInsuranceCollection) throw new Error("InsuranceServices collection not initialized.");
  return bookInsuranceCollection;
}

function getVisitorsCollection() {
  if (!visitorsCollection) throw new Error("Visitors collection not initialized.");
  return visitorsCollection;
}

function getCustomerCollection() {
  if (!customerCollection) throw new Error("Customer collection not initialized.");
  return customerCollection;
}

function getProfileDesignCollection() {
  if (!profileDesignCollection) throw new Error("ProfileDesign collection not initialized.");
  return profileDesignCollection;
}

function getUsersCollection() {
  if (!usersCollection) throw new Error("Users collection not initialized.");
  return usersCollection;
}

function getPoliciesCollection() {
  if (!policiesCollection) throw new Error("Policies collection not initialized.");
  return policiesCollection;
}
function getRegisterCollection() {
  if (!registerCollection) throw new Error("Policies collection not initialized.");
  return registerCollection;
}
function getCreateOrderCollection() {
  if (!createOrderCollection) throw new Error("Policies collection not initialized.");
  return createOrderCollection;
}

function getProductsCollection() {
  if (!ProductsCollection) throw new Error("Policies collection not initialized.");
  return ProductsCollection;
}
function getHeroCarouselCollection() {
  if (!HeroCarouselCollection) throw new Error("Policies collection not initialized.");
  return HeroCarouselCollection;
}
function getPaymentsInsuranceCollection() {
  if (!paymentsInsuranceCollection) throw new Error("Policies collection not initialized.");
  return paymentsInsuranceCollection;
}
function getContactCollection() {
  if (!contactCollection) throw new Error("Policies collection not initialized.");
  return contactCollection;
}
function getContactCollection() {
  if (!insuranceservicesBooking) throw new Error("Policies collection not initialized.");
  return insuranceservicesBooking;
}

module.exports = {
  connectDB,
  getClaimsCollection,
 getmakeUpCollection,
  getcamerasCollection,
  getsunglassesCollection,
  getcategoriesCollection,
  getBlogPostCollection,
  getelectronicsCollection,
  getAirTicketCollection,
  getfeatureProductsCollection,
  getchilldsToyCollection,
  getBookInsuranceCollection,
  getSubscribersCollection,
  getVisitorsCollection,
  getCustomerCollection,
  getContactCollection,
  getProfileDesignCollection,
  getUsersCollection,
  getPoliciesCollection,
  getRegisterCollection,
  getCreateOrderCollection,
  getHeroCarouselCollection,
  getProductsCollection,
  gethomebannersCollection,
  getPaymentsInsuranceCollection,
};
