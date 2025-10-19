const express = require('express');
const { ObjectId } = require('mongodb');
const { getVisitorsCollection } = require('../db');

const router = express.Router();

// ========== GET All Visitors ==========
router.get('/', async (req, res) => {
  try {
    const visitors = await getVisitorsCollection().find().toArray();
    res.status(200).json(visitors);
  } catch (error) {
    console.error('[GET /visitors] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

// ========== GET Visitor by ID ==========
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const visitor = await getVisitorsCollection().findOne({ _id: new ObjectId(id) });
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.status(200).json(visitor);
  } catch (error) {
    console.error(`[GET /visitors/${id}] Error:`, error.message);
    res.status(500).json({ error: 'Failed to retrieve visitor' });
  }
});

// ========== POST Create New Visitor ==========
router.post('/', async (req, res) => {
  const visitor = req.body;

  // ✅ Required fields
  const requiredFields = ['title', 'description', 'image', 'link', 'createdAt'];
  const missingFields = requiredFields.filter((field) => !visitor[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });
  }

  try {
    const result = await getVisitorsCollection().insertOne(visitor);
    res.status(201).json({
      message: 'Visitor created successfully',
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error('[POST /visitors] Error:', error.message);
    res.status(500).json({ error: 'Failed to create visitor' });
  }
});

// ========== PUT Update Visitor ==========
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const result = await getVisitorsCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.status(200).json({ message: 'Visitor updated successfully' });
  } catch (error) {
    console.error(`[PUT /visitors/${id}] Error:`, error.message);
    res.status(500).json({ error: 'Failed to update visitor' });
  }
});

// ========== DELETE Visitor ==========
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const result = await getVisitorsCollection().deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.status(200).json({ message: 'Visitor deleted successfully' });
  } catch (error) {
    console.error(`[DELETE /visitors/${id}] Error:`, error.message);
    res.status(500).json({ error: 'Failed to delete visitor' });
  }
});

module.exports = router;
