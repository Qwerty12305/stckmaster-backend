const express = require("express");
const router = express.Router();
const Investplan = require("../models/Investplan");

router.post("/", async (req, res) => {
  try {
    const newPlan = new Investplan(req.body);
    await newPlan.save();
    res.status(201).json({ message: "Investment plan stored successfully" });
  } catch (err) {
    console.error("Error saving invest plan:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET total invested amount by userId
router.get("/total/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await Investplan.aggregate([
      { $match: { userId, status: "active" } },
      {
        $group: {
          _id: null,
          totalInvested: { $sum: "$amount" },
        },
      },
    ]);

    const total = result[0]?.totalInvested || 0;
    res.json({ userId, totalInvested: total });
  } catch (error) {
    console.error("Error fetching total investment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//total invested plan details
router.get("/plans/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const plans = await Investplan.find({ userId, status: "active" }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    console.error("Error fetching invested plans:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/invest/summary/:userId
// ✅ Summary route for user
router.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all plans for the user
    const plans = await Investplan.find({ userId });

    if (!plans || plans.length === 0) {
      return res.status(404).json({ message: "No investments found for this user." });
    }

    // Summarize data over all plans (not just active)
    let dailyIncome = 0;
    let totalIncome = 0;
    let earnedIncome = 0;
    let creditedDays = 0;
    let duration = 0;

    plans.forEach(plan => {
      dailyIncome += plan.dailyIncome || 0;
      totalIncome += plan.totalIncome || 0;
      earnedIncome += plan.earnedIncome || 0;
      creditedDays += plan.creditedDays || 0;
      duration += plan.duration || 0;
    });

    const summary = {
      dailyIncome,
      totalIncome,
      earnedIncome,
      remainingIncome: totalIncome - earnedIncome,
      creditedDays,
      remainingDays: duration - creditedDays,
    };

    // Send full response: calculated summary + full list of plans
    res.json({
      summary,
      plans, // includes status for each
    });

  } catch (error) {
    console.error("Error in summary route:", error);
    res.status(500).json({ message: "Error fetching investment summary" });
  }
});







module.exports = router;
