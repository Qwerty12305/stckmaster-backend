const express = require("express");
const router = express.Router();
const Withdraw = require("../models/Withdraw");
const Bank = require("../models/Bank");
const User = require('../models/User');


// POST /api/withdraw
router.post("/", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: "userId and amount are required." });
    }

    // Find bank for user
    const bank = await Bank.findOne({ userId });
    if (!bank) {
      return res.status(404).json({ message: "Bank not found for this user." });
    }

    // Find user to get referredBy
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const newWithdraw = new Withdraw({
      userId,
      customerName: bank.customerName,
      bankName: bank.bankName,
      account: bank.account,
      ifscCode: bank.ifsc,
      referredBy: user.referredBy || null,
      amount,
    });

    await newWithdraw.save();
    res.status(201).json({ message: "Withdraw request saved successfully." });
  } catch (err) {
    console.error("Withdraw Error:", err);
    res.status(500).json({ message: "Server error." });
  }
});


//Get full details through userid where user will get withdraw history
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await Withdraw.find({ userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error("Withdraw History Error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
