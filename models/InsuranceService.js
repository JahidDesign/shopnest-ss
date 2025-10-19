const mongoose = require("mongoose");

const insuranceServiceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true, trim: true },
  providerName: { type: String, required: true, trim: true },
  coverageAmount: { type: Number, default: 0 },
  premium: { type: Number, default: 0 },
  contactEmail: { type: String, trim: true },
  contactNumber: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  description: { type: String, trim: true },
});

module.exports = mongoose.model("InsuranceService", insuranceServiceSchema);
