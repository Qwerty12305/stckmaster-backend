const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');

// GET all plans
router.get('/all', async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});




module.exports = router;
