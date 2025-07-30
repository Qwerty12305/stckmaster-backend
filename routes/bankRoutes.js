const express = require("express");
const router = express.Router();
const Bank = require("../models/Bank");

// Add a new bank
router.post("/", async (req, res) => {
  try {
    const { userId, bankName, account, ifsc, customerName } = req.body;

    if (!userId || !bankName || !account || !ifsc || !customerName) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newBank = new Bank({
      userId,
      bankName,
      account,
      ifsc,
      customerName,
    });

    await newBank.save();
    res.status(201).json({ message: "Bank added successfully." });
  } catch (err) {
    console.error("Error adding bank:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Get all banks for a user
// ✅ Get all banks for a user
router.get("/:userId", async (req, res) => {
  const banks = await Bank.find({ userId: req.params.userId });
  res.json(banks);
});




module.exports = router;
