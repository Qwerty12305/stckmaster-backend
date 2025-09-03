const express = require("express");
const router = express.Router();
const Deposit = require("../models/Deposit");
const User = require("../models/User"); // Make sure this is imported

// POST /api/deposit
router.post("/", async (req, res) => {
  let { userId, amount, utr } = req.body;

  if (!userId || !amount || !utr) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Convert amount to number
  amount = Number(amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    // 🔍 Fetch the user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const referredBy = user.referredBy || null;

    // 🔹 Check if this is the user's first deposit
    const existingDeposits = await Deposit.find({ userId, status: "success" });
    let totalAmount = amount;
    let bonusAmount = 0;

    if (existingDeposits.length === 0) {
      // First deposit → give 10% bonus
      bonusAmount = amount * 0.1;
      totalAmount += bonusAmount;
    }

    // Save the deposit
    const deposit = new Deposit({
      userId,
      realamount: amount,
      amount: totalAmount, // amount + bonus if first deposit
      bonus: bonusAmount,   // optional field to track bonus separately
      utr,
      status: "pending",
      referredBy,
      createdAt: new Date(),
    });

    await deposit.save();

    res.status(201).json({ 
      message: `Deposit saved. ${bonusAmount > 0 ? "10% bonus applied!" : ""} Awaiting verification.`,
      depositedAmount: totalAmount,
      bonusAmount
    });
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
