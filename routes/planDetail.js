const express = require('express');
const router = express.Router();

const Plan = require('../models/Plandetail');  // Import the Plan model here

router.get('/:planId', async (req, res) => {
  try {
    const plans = await Plan.find({ planId: req.params.planId });  // Use find instead of findOne

    if (plans.length === 0) {
      return res.status(404).json({ message: 'No plans found for this planId' });
    
    }

    res.json(plans);  // Send array of matching plans
  } catch (err) {
    console.error('Error fetching plans:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
