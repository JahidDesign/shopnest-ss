// routes/tours.js
const express = require('express');
const { ObjectId } = require('mongodb');
const {   getInsuranceCarouselCollection } = require('../db');

const router = express.Router();

// Helper function to validate booking data
function validateBooking(data) {
  const { title, description, image, eventName, insuranceName } = data;
  if (!title || !description || !image || !eventName || !insuranceName) {
    return false;
  }
  return true;
}

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await getInsuranceCarouselCollection().find().toArray();
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch tour bookings' });
  }
});

// GET a booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await getInsuranceCarouselCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Invalid booking ID' });
  }
});

// CREATE a new booking
router.post('/', async (req, res) => {
  try {
    if (!validateBooking(req.body)) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await getInsuranceCarouselCollection().insertOne(req.body);
    res.status(201).json({ success: true, message: 'Booking created', insertedId: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Failed to create booking' });
  }
});

// UPDATE a booking by ID
router.put('/:id', async (req, res) => {
  try {
    if (!validateBooking(req.body)) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await getInsuranceCarouselCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { upsert: false } // Prevent creating a new document if ID doesn't exist
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking updated', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Failed to update booking' });
  }
});

// DELETE a booking by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await getInsuranceCarouselCollection().deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Failed to delete booking' });
  }
});

module.exports = router;
