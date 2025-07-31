const express = require("express");
const router = express.Router();
const Withdraw = require("../models/Withdraw");
const Bank = require("../models/Bank");
const User = require("../models/User"); // ✅ make sure this is imported




// POST /api/withdraw
router.post("/", async (req, res) => {
  try {
    const { userId, amount, bankId  } = req.body;

    const bankAbc = "688ba6ca952cb8e8b29f54ca";

const bank = await Bank.findOne({ _id: mongoose.Types.ObjectId(bankAbc) });
 



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
