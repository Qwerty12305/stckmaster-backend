const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");  // <--- import mongoose
const Withdraw = require("../models/Withdraw");
const Bank = require("../models/Bank");
const User = require("../models/User");

router.post("/", async (req, res) => {
  try {
    const { userId, amount, bankId } = req.body;

    if (!userId || !amount || !bankId) {
      return res.status(400).json({ message: "userId, amount and bankId are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(bankId)) {
      return res.status(400).json({ message: "Invalid bankId." });
    }

    // Find bank by bankId
    const bank = await Bank.findById(bankId);
    if (!bank) {
      return res.status(404).json({ message: "Bank details not found." });
    }

    const withdraw = new Withdraw({
      userId,
      amount,
      customerName: bank.customerName,
      bankName: bank.bankName,
      ifscCode: bank.ifsc,
      accountNumber: bank.account,
      status: "pending",
    });

    await withdraw.save();

    res.status(201).json({ message: "Withdrawal request submitted." });
  } catch (error) {
    console.error("Withdraw Error:", error);
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
