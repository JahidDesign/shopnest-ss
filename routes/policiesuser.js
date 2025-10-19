// routes/applications.js
const express = require('express');
const { ObjectId } = require('mongodb');
const { getAirTicketCollection } = require('../db');

const router = express.Router();

/**
 * GET /applications
 * Fetch all applications/subscriptions
 */
router.get('/', async (req, res) => {
  try {
    const applications = await getAirTicketCollection().find().toArray();
    res.status(200).json(applications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * GET /applications/:id
 * Fetch a single application by ID
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const application = await getAirTicketCollection().findOne({ _id: new ObjectId(id) });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    res.status(200).json(application);
  } catch (err) {
    console.error('Error fetching application:', err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

/**
 * POST /applications
 * Create a new subscription or insurance application
 * If only name + email provided => treat as subscription
 * If full insurance fields provided => full application
 */
router.post('/', async (req, res) => {
  const { name, email, insuranceType, coverage, paymentTerm } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const newApplication = { name, email, date: new Date().toISOString() };

  // If full insurance application fields exist, add them
  if (insuranceType && coverage && paymentTerm) {
    newApplication.insuranceType = insuranceType;
    newApplication.coverage = coverage;
    newApplication.paymentTerm = paymentTerm;
    newApplication.status = 'Pending';
  }

  try {
    const result = await getAirTicketCollection().insertOne(newApplication);
    res.status(201).json({
      message: 'Application submitted successfully',
      insertedId: result.insertedId
    });
  } catch (err) {
    console.error('Error creating application:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

/**
 * PUT /applications/:id
 * Update an application
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updatedFields = req.body;

  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const result = await getAirTicketCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFields }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Application not found' });

    res.status(200).json({ message: 'Application updated successfully' });
  } catch (err) {
    console.error('Error updating application:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

/**
 * DELETE /applications/:id
 * Delete an application
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

  try {
    const result = await getAirTicketCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Application not found' });

    res.status(200).json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error('Error deleting application:', err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

module.exports = router;
