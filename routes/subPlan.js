const express = require('express');
const router = express.Router();
const SubPlan = require('../models/SubPlan');  // your Mongoose SubPlan model
const Plan = require('../models/Plan');        // your Mongoose Plan model

// Create a sub-plan under a given planId
router.post('/:planId', async (req, res) => {
  const { planId } = req.params;
  const { subPlanName, amount, lockingPeriod, percentage, parentPlanId } = req.body;

  try {
    // Validate parent plan exists
    const parentPlan = await Plan.findById(planId);
    if (!parentPlan) {
      return res.status(404).json({ error: 'Parent plan not found' });
    }

    // Validate required fields
    if (!subPlanName || !amount || !lockingPeriod || !percentage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the sub plan document
    const newSubPlan = new SubPlan({
      subPlanName,
      amount,
      lockingPeriod,
      percentage,
      parentPlanId: planId,
    });

    await newSubPlan.save();

    return res.status(201).json(newSubPlan);
  } catch (error) {
    console.error('Error creating sub plan:', error);
    return res.status(500).json({ error: 'Server error while creating sub plan' });
  }
});

router.get('/all/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const subPlans = await SubPlan.find({ parentPlanId: planId });
    res.json(subPlans);
  } catch (error) {
    console.error('Error fetching sub plans:', error);
    res.status(500).json({ error: 'Server error fetching sub plans' });
  }
});

router.get('/singleplan/:subPlanId', async (req, res) => {
  try {
    const { subPlanId } = req.params;
    
    // Validate ObjectId
    if (!subPlanId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid Sub Plan ID' });
    }
    
    const subPlan = await SubPlan.findById(subPlanId).populate('parentPlanId', 'planName planId'); // populate parent plan if needed
    
    if (!subPlan) {
      return res.status(404).json({ error: 'Sub Plan not found' });
    }
    
    res.json(subPlan);
  } catch (error) {
    console.error('Error fetching sub plan:', error);
    res.status(500).json({ error: 'Server error fetching sub plan' });
  }
});


// POST create a new sub plan for a specific main plan
router.post('/create/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const { subPlanName, amount, lockingPeriod, percentage } = req.body;

    // Basic validation
    if (!subPlanName || !amount || !lockingPeriod || !percentage) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Calculate percentageAmount here
    const percentageAmount = (Number(amount) * Number(percentage)) / 100;

    const newSubPlan = new SubPlan({
      subPlanName,
      amount,
      lockingPeriod,
      percentage,
      percentageAmount,  // store calculated value
      parentPlanId: planId,
    });

    const savedSubPlan = await newSubPlan.save();
    res.status(201).json(savedSubPlan);
  } catch (error) {
    console.error('Error creating sub plan:', error);
    res.status(500).json({ error: 'Server error creating sub plan' });
  }
});



router.put('/:subPlanId', async (req, res) => {
  const { subPlanId } = req.params;
  const { subPlanName, amount, lockingPeriod, percentage, parentPlanId } = req.body;

  try {
    // Optional: Validate parent plan if parentPlanId is provided and changed
    if (parentPlanId) {
      const parentPlan = await Plan.findById(parentPlanId);
      if (!parentPlan) {
        return res.status(404).json({ error: 'Parent plan not found' });
      }
    }

    // Validate required fields (you may want to relax this if partial updates allowed)
    if (!subPlanName || !amount || !lockingPeriod || !percentage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const percentageAmount = (amount * percentage) / 100;

    const updatedSubPlan = await SubPlan.findByIdAndUpdate(
      subPlanId,
      { subPlanName, amount, lockingPeriod, percentage, percentageAmount, parentPlanId },
      { new: true, runValidators: true }
    );

    if (!updatedSubPlan) {
      return res.status(404).json({ error: 'Sub plan not found' });
    }

    res.json(updatedSubPlan);
  } catch (error) {
    console.error('Error updating sub plan:', error);
    res.status(500).json({ error: 'Server error while updating sub plan' });
  }
});
router.delete('/:subPlanId', async (req, res) => {
  const { subPlanId } = req.params;

  try {
    const deletedSubPlan = await SubPlan.findByIdAndDelete(subPlanId);

    if (!deletedSubPlan) {
      return res.status(404).json({ error: 'Sub plan not found' });
    }

    res.json({ message: 'Sub plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub plan:', error);
    res.status(500).json({ error: 'Server error while deleting sub plan' });
  }
});


module.exports = router;
