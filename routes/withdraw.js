const express = require("express");
const router = express.Router();
const twilio = require('twilio');
const mongoose = require("mongoose");  // <--- import mongoose
const Withdraw = require("../models/Withdraw");
const Bank = require("../models/Bank");
const User = require("../models/User");
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

router.post('/send-otp-withdrawl', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

const user = await User.findOne({ userId: userId });

    if (!user || !user.mobile) {
      return res.status(404).json({ error: 'User mobile not found' });
    }

    await client.verify.v2.services(verifySid)
      .verifications
      .create({ to: `+91${user.mobile}`, channel: 'sms' });

    res.json({ success: true, message: 'OTP sent to your mobile number' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});




router.post("/", async (req, res) => {
  try {
    const { userId, amount, bankId, otp } = req.body;

    if (!userId || !amount || !bankId || !otp) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1️⃣ Find bank details
    const bank = await Bank.findOne({ _id: mongoose.Types.ObjectId.createFromHexString(bankId) });
    if (!bank) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    // 2️⃣ Fetch user's mobile number
const user = await User.findOne({ userId: userId });
    if (!userId || !user.mobile) {
      return res.status(404).json({ message: "User or mobile number not found" });
    }

    // 3️⃣ Verify OTP using Twilio
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: `+91${user.mobile}`, code: otp });

    if (verificationCheck.status !== "approved") {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 4️⃣ Save withdrawal details to DB
    const withdraw = new Withdraw({
      userId,
      customerName: bank.customerName,
      bankName: bank.bankName,
      ifscCode: bank.ifsc,
      account: bank.account,
      amount,
      status: "pending",
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