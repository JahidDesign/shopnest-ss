// routes/tours.js
const express = require('express');
const { ObjectId } = require('mongodb');
const {
  getUsersCollection,
} = require('../db'); // Make sure this is properly exported

const router = express.Router();

// GET all tour bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await getUsersCollection().find().toArray();
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch tour bookings' });
  }
});

// GET a specific booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await getUsersCollection().findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Invalid ID format or error:', error);
    res.status(400).json({ error: 'Invalid booking ID' });
  }
});

// CREATE a new booking
router.post('/', async (req, res) => {
  try {
    const result = await getUsersCollection().insertOne(req.body);
    res
      .status(201)
      .json({ message: 'Booking created successfully', insertedId: result.insertedId });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(400).json({ error: 'Failed to create booking' });
  }
});

// UPDATE an existing booking
router.put('/:id', async (req, res) => {
  try {
    const result = await getUsersCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { upsert: false }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking updated successfully', result });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(400).json({ error: 'Failed to update booking' });
  }
});

// DELETE a booking
router.delete('/:id', async (req, res) => {
  try {
    const result = await getUsersCollection().deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(400).json({ error: 'Failed to delete booking' });
  }
});

module.exports = router;
