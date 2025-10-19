//claims

const express = require('express');
const { ObjectId } = require('mongodb');
const { getClaimsCollection } = require('../db');

const router = express.Router();

// GET all tour bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await getClaimsCollection().find().toArray();
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error("[GET /claimse] Error:", error);
    res.status(500).json({ success: false, error: 'Failed to fetch tour bookings' });
  }
});

// GET a specific booking by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const booking = await getClaimsCollection().findOne({ _id: new ObjectId(id) });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error(`[GET /claimse/${req.params.id}] Error:`, error);
    res.status(500).json({ success: false, error: 'Failed to fetch booking' });
  }
});

// CREATE a new booking
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    const result = await getClaimsCollection().insertOne(bookingData);
    res.status(201).json({
      success: true,
      message: 'Booking created',
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("[POST /claimse] Error:", error);
    res.status(400).json({ success: false, error: 'Failed to create booking' });
  }
});

// UPDATE a booking by ID
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const updateData = req.body;
    const result = await getClaimsCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { upsert: false } // Do not insert new if not found
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking updated', result });
  } catch (error) {
    console.error(`[PUT /claimse/${req.params.id}] Error:`, error);
    res.status(400).json({ success: false, error: 'Failed to update booking' });
  }
});

// DELETE a booking by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid booking ID' });
    }

    const result = await getClaimsCollection().deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error(`[DELETE /claimse/${req.params.id}] Error:`, error);
    res.status(400).json({ success: false, error: 'Failed to delete booking' });
  }
});

module.exports = router;
