require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const router = express.Router();

const Withdraw = require("../models/Withdraw");
const Bank = require("../models/Bank");
const User = require("../models/User");

const AUTH_TOKEN = process.env.MESSAGECENTRAL_AUTH_TOKEN;
const CUSTOMER_ID = process.env.MESSAGECENTRAL_CUSTOMER_ID;

const COUNTRY_CODE = "91"; // ✅ Static country code

if (!AUTH_TOKEN || !CUSTOMER_ID) {
  console.warn("⚠️ MESSAGECENTRAL_AUTH_TOKEN or CUSTOMER_ID missing!");
}

// --------------------- SEND OTP FOR WITHDRAWAL ---------------------
router.post("/send-otp-withdrawal", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    const user = await User.findOne({ userId });
    if (!user || !user.mobile) {
      return res.status(404).json({ success: false, error: "User or mobile not found" });
    }

    // Send OTP via MessageCentral
    const response = await axios.post(
      `https://cpaas.messagecentral.com/verification/v3/send?countryCode=${COUNTRY_CODE}&customerId=${CUSTOMER_ID}&flowType=SMS&mobileNumber=${user.mobile}`,
      {},
      { headers: { authToken: AUTH_TOKEN } }
    );

    const data = response.data.data;
    if (!data?.verificationId) {
      return res.status(500).json({ success: false, error: "Failed to generate OTP" });
    }

    res.status(200).json({
      success: true,
      verificationId: data.verificationId,
      mobileNumber: data.mobileNumber,
      message: "OTP Sent ✅",
      timeout: 60
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ success: false, error: "Failed to send OTP" });
  }
});

// --------------------- VERIFY OTP & SUBMIT WITHDRAWAL ---------------------



router.post("/", async (req, res) => {
  try {
    const { userId, amount, bankId, code, verificationId } = req.body;

    if (!userId || !amount || !bankId || !code || !verificationId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findOne({ userId });
    if (!user || !user.mobile) {
      return res.status(404).json({ message: "User or mobile not found" });
    }

    // Verify OTP via MessageCentral with country code 91
    const otpResponse = await axios.get(
      `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${user.mobile}&verificationId=${verificationId}&customerId=${CUSTOMER_ID}&code=${code}`,
      { headers: { authToken: AUTH_TOKEN } }
    );

    const { responseCode, data } = otpResponse.data;

    if (responseCode !== 200 || data?.verificationStatus !== "VERIFICATION_COMPLETED") {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Find bank details
    const bank = await Bank.findById(bankId);
    if (!bank) return res.status(404).json({ message: "Bank details not found" });

    // Save withdrawal request
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

    res.status(201).json({ message: "Withdrawal request submitted ✅" });

  } catch (err) {
    console.error("Withdraw Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Server error." });
  }
});


// --------------------- GET USER WITHDRAWAL HISTORY ---------------------
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
