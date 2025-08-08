const express = require("express");
const router = express.Router();
const Bank = require("../models/Bank");
      
// Add a new bank
router.post("/add", async (req, res) => {
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

//delete bank details
router.delete("/delete/:bankId", async (req, res) => {
  try {
    const { bankId } = req.params;

    const deletedBank = await Bank.findByIdAndDelete(bankId);

    if (!deletedBank) {
      return res.status(404).json({ message: "Bank record not found" });
    }

    res.json({ message: "Bank deleted successfully", bank: deletedBank });
  } catch (error) {
    console.error("Error deleting bank:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// update bank record
// UPDATE bank
router.put("/update/:bankId", async (req, res) => {
  try {
    const { bankId } = req.params;
    const { customerName, bankName, account, ifsc } = req.body;

    const updatedBank = await Bank.findByIdAndUpdate(
      bankId,
      { customerName, bankName, account, ifsc },
      { new: true }
    );

    if (!updatedBank) {
      return res.status(404).json({ message: "Bank record not found" });
    }

    res.json({ message: "Bank updated successfully", bank: updatedBank });
  } catch (error) {
    console.error("Error updating bank:", error);
    res.status(500).json({ message: "Server error" });
  }
});





module.exports = router;
