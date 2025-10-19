require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const { ObjectId } = require('mongodb');
const { getCreateOrderCollection } = require('../db'); // single collection
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// CREATE a payment/order
router.post('/', async (req, res) => {
  const { policyId, title, premium, coverageAmount, type } = req.body;

  if (!policyId || !premium || !title) {
    return res.status(400).json({ error: 'Missing required policy fields' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(premium * 100),
      currency: 'usd',
      description: `${title} - ${type} policy`,
      payment_method_types: ['card'],
    });

    const orderData = {
      policyId,
      title,
      type,
      premium,
      coverageAmount,
      paymentIntentId: paymentIntent.id,
      status: 'pending',
      createdAt: new Date(),
    };

    const result = await getCreateOrderCollection().insertOne(orderData);

    res.status(201).json({
      message: 'Order created successfully',
      orderId: result.insertedId,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ error: 'Payment creation failed' });
  }
});

// GET all payments/orders
router.get('/', async (req, res) => {
  try {
    const orders = await getCreateOrderCollection().find().toArray();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH payment status (for Accept/Reject)
router.patch('/:id', async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'completed', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await getCreateOrderCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Order not found' });

    const updatedOrder = await getCreateOrderCollection().findOne({ _id: new ObjectId(req.params.id) });
    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE an order
router.delete('/:id', async (req, res) => {
  try {
    const result = await getCreateOrderCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Order not found' });

    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
