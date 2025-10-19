// routes/contact.js
const express = require("express");
const { ObjectId } = require("mongodb");
const { getContactCollection } = require("../db");

const router = express.Router();

// GET all contacts
router.get("/", async (req, res) => {
  try {
    const contacts = await getContactCollection().find().toArray();
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error("[GET /contact] Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch contacts" });
  }
});

// GET single contact
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }
    const contact = await getContactCollection().findOne({ _id: new ObjectId(id) });
    if (!contact) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error("[GET /contact/:id] Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch contact" });
  }
});

// CREATE contact
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message, inquiryType } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const result = await getContactCollection().insertOne({
      name,
      email,
      phone,
      subject,
      message,
      inquiryType,
      date: new Date(),
    });

    res.status(201).json({ success: true, message: "Contact created", insertedId: result.insertedId });
  } catch (error) {
    console.error("[POST /contact] Error:", error);
    res.status(400).json({ success: false, error: "Failed to create contact" });
  }
});

// UPDATE contact
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }

    const updateData = req.body;
    const result = await getContactCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    res.json({ success: true, message: "Contact updated" });
  } catch (error) {
    console.error("[PUT /contact/:id] Error:", error);
    res.status(400).json({ success: false, error: "Failed to update contact" });
  }
});

// DELETE contact
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "Invalid ID" });
    }

    const result = await getContactCollection().deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: "Contact not found" });
    }

    res.json({ success: true, message: "Contact deleted" });
  } catch (error) {
    console.error("[DELETE /contact/:id] Error:", error);
    res.status(400).json({ success: false, error: "Failed to delete contact" });
  }
});

module.exports = router;
