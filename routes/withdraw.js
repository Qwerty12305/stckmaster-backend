const express = require("express");
const router = express.Router();
const Withdraw = require("../models/Withdraw");
const Bank = require("../models/Bank");
const User = require("../models/User"); // ✅ make sure this is imported




// POST /api/withdraw
router.post("/", async (req, res) => {
  try {
    const { userId, amount } = req.body;

     if (!userId || !amount || !bankId) {
      return res.status(400).json({ message: "Missing userId or amount" });
    }

    // 🔍 Find the user's bank details
   const bank = await Bank.findById(selectedBank);


    if (!bank) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    // 💾 Create and save the withdrawal request
    const withdraw = new Withdraw({
      userId,
      amount,
      customerName: bank.customerName,
      bankName: bank.bankName,
      ifscCode: bank.ifsc,
      accountNumber: bank.account,
      status: "pending", // default
    });

    await withdraw.save();

    res.status(201).json({ message: "Withdrawal request submitted" });
  } catch (error) {
    console.error("Withdraw Error:", error);
    res.status(500).json({ message: "Server error" });
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
