const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const User = require("../models/User"); // Make sure this is imported

// POST /api/deposit
router.post("/", async (req, res) => {
  const { userId, amount, utr } = req.body;

  if (!userId || !amount || !utr) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // 🔍 Fetch the user's referredBy from User collection
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const referredBy = user.referredBy || null; // ✅ referral code used when signing up

    const deposit = new Deposit({
      userId,
      amount,
      utr,
      status: "pending",
      referredBy, // ✅ saved here
      createdAt: new Date(),
    });

    await deposit.save();
    res.status(201).json({ message: "Deposit saved. Awaiting verification." });
  } catch (error) {
    console.error("Deposit error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/// Api History
router.get("/:userId", async (req, res) => {
  try {
    const deposits = await Deposit.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch deposits", error: err.message });
  }
});
//Total successful amomt loaded
// GET /api/deposit/total-success/:userId
router.get("/total-success/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const result = await Deposit.aggregate([
      { $match: { userId: userId, status: "success" } },
      {
        $group: {
          _id: "$userId",
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    const total = result[0]?.totalAmount || 0;

    res.json({ userId, totalSuccessAmount: total });
  } catch (error) {
    console.error("Failed to calculate total success amount:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


module.exports = router;
