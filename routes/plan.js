const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const SubPlan = require('../models/SubPlan');


// GET all plans
router.get('/all', async (req, res) => {
  try {
    const plans = await Plan.find();

    // For each plan, count sub plans linked via parentPlanId
    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        const subPlanCount = await SubPlan.countDocuments({ parentPlanId: plan._id });
        return {
          ...plan.toObject(), // convert mongoose doc to plain object
          subPlanCount,
        };
      })
    );

    res.json(plansWithCounts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch plans with sub plan counts' });
  }
});

const generateUniquePlanId = async () => {
  const prefix = "PLAN";
  const lastPlan = await Plan.findOne().sort({ _id: -1 }); // Get latest plan

  let nextId = 1;
  if (lastPlan && lastPlan.planId && lastPlan.planId.startsWith(prefix)) {
    const numberPart = parseInt(lastPlan.planId.replace(prefix, ""), 10);
    nextId = numberPart + 1;
  }

  return `${prefix}${String(nextId).padStart(3, "0")}`; // PLAN001, PLAN002...
};

router.post("/", async (req, res) => {
  const { planName } = req.body;

  if (!planName) {
    return res.status(400).json({ error: "Plan name is required" });
  }

  try {
    const planId = await generateUniquePlanId();

    const newPlan = new Plan({ planId, planName });
    await newPlan.save();

    res.status(201).json({ message: "Plan created", plan: newPlan });
  } catch (err) {
    console.error("Error creating plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// PUT /api/plan/:id
router.put('/:id', async (req, res) => {
  const { planName } = req.body;
  const { id } = req.params;

  if (!planName) {
    return res.status(400).json({ error: 'Plan name is required' });
  }

  try {
    const updated = await Plan.findByIdAndUpdate(id, { planName }, { new: true });

    if (!updated) return res.status(404).json({ error: 'Plan not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});





module.exports = router;
