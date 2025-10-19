const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    nid: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String },
    insuranceType: { type: String, enum: ["life", "health", "vehicle"], required: true },
    coverage: { type: Number, required: true },
    paymentTerm: { type: String, enum: ["monthly", "yearly"], required: true },
    nomineeName: { type: String, required: true },
    nomineeRelation: { type: String, required: true },
    nomineeNid: { type: String, required: true },
    nidDocumentUrl: { type: String },
    additionalDocsUrl: { type: String },
    healthCondition: { type: String, enum: ["Yes", "No"], default: "No" },
    healthDetails: { type: String },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    assignedAgent: { type: String },
    applicationDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", ApplicationSchema);
