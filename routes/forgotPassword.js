require('dotenv').config();
const express = require("express");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

const AUTH_TOKEN = process.env.MESSAGECENTRAL_AUTH_TOKEN;
const CUSTOMER_ID = process.env.MESSAGECENTRAL_CUSTOMER_ID;

// In-memory store for optional expiry tracking
const otpStore = {};

// --------------------- SEND OTP FOR FORGOT PASSWORD ---------------------
router.post("/forgot-password", async (req, res) => {
  let { mobileNumber } = req.body;

  if (!mobileNumber) {
    return res.status(400).json({ success: false, error: "Mobile number required" });
  }

  // Remove non-digit characters
  mobileNumber = mobileNumber.replace(/\D/g, '');

  // Remove leading '91' if present
  if (mobileNumber.startsWith('91') && mobileNumber.length === 12) {
    mobileNumber = mobileNumber.slice(2);
  }

  // Validate 10-digit number
  if (!/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ success: false, error: "Valid 10-digit mobile number required" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ mobile: mobileNumber });
    if (!user) return res.status(404).json({ success: false, error: "User not found ❌" });

    // Send OTP via MessageCentral (hardcoded country code 91)
    const response = await axios.post(
      `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=${CUSTOMER_ID}&flowType=SMS&mobileNumber=${mobileNumber}`,
      {},
      { headers: { authToken: AUTH_TOKEN } }
    );

    const data = response.data?.data;
    if (!data?.verificationId) return res.status(500).json({ success: false, error: "Failed to send OTP" });

    // Optional: store verificationId for expiry tracking
    otpStore[mobileNumber] = { verificationId: data.verificationId, expiresAt: Date.now() + 5*60*1000 };

    res.status(200).json({
      success: true,
      message: "OTP sent successfully ✅",
      verificationId: data.verificationId,
      mobileNumber,
      timeout: 300 // 5 min
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Failed to send OTP" });
  }
});

// --------------------- VERIFY OTP & RESET PASSWORD ---------------------
router.post("/verify-forgot-otp", async (req, res) => {
  
  let { mobileNumber, verificationId, code, newPassword } = req.body;

  if (!mobileNumber || !verificationId || !code || !newPassword) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  // Remove non-digit characters
  mobileNumber = mobileNumber.replace(/\D/g, '');

  // Remove leading '91' if present
  if (mobileNumber.startsWith('91') && mobileNumber.length === 12) {
    mobileNumber = mobileNumber.slice(2);
  }

  const record = otpStore[mobileNumber];
  if (!record || record.verificationId !== verificationId || Date.now() > record.expiresAt) {
    return res.status(400).json({ success: false, error: "Invalid or expired OTP ❌" });
  }

  try {
    // Verify OTP via MessageCentral (hardcoded country code 91)
    const otpResponse = await axios.get(
      `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${CUSTOMER_ID}&code=${code}`,
      { headers: { authToken: AUTH_TOKEN } }
    );

    const { responseCode, data } = otpResponse.data;

    if (responseCode === 200 && data?.verificationStatus === "VERIFICATION_COMPLETED") {
      // Reset password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate({ mobile: mobileNumber }, { password: hashedPassword });

      // Remove OTP record
      delete otpStore[mobileNumber];

      return res.status(200).json({ success: true, message: "Password reset successfully ✅" });
    } else if (responseCode === 702) {
      return res.status(400).json({ success: false, error: "Wrong OTP ❌" });
    } else if (responseCode === 705) {
      return res.status(400).json({ success: false, error: "OTP expired ❌" });
    } else {
      return res.status(400).json({ success: false, error: "OTP verification failed ❌" });
    }

  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Server error during OTP verification" });
  }
});

module.exports = { router, otpStore };
