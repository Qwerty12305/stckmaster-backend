require('dotenv').config();
const express = require("express");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User"); // Make sure your User model exists

const AUTH_TOKEN = process.env.MESSAGECENTRAL_AUTH_TOKEN;
const CUSTOMER_ID = process.env.MESSAGECENTRAL_CUSTOMER_ID;

if (!AUTH_TOKEN || !CUSTOMER_ID) {
  console.warn("⚠️ MESSAGECENTRAL_AUTH_TOKEN or CUSTOMER_ID missing!");
}

// --------------------- SEND OTP ---------------------
router.post("/send-otp", async (req, res) => {
  const { mobileNumber, countryCode } = req.body;

  if (!mobileNumber || !countryCode) {
    return res.status(400).json({ error: "Mobile number & country code required" });
  }

  try {
    const response = await axios.post(
      `https://cpaas.messagecentral.com/verification/v3/send?countryCode=${countryCode}&customerId=${CUSTOMER_ID}&flowType=SMS&mobileNumber=${mobileNumber}`,
      {},
      { headers: { authToken: AUTH_TOKEN } }
    );

    const { responseCode, data } = response.data;

    if (responseCode === "506") {
      return res.status(200).json({
        verificationId: data.verificationId,
        mobileNumber: data.mobileNumber,
        message: "OTP already sent. Use existing OTP or wait for timeout.",
        timeout: data.timeout,
      });
    }

    return res.status(200).json({
      verificationId: data.verificationId,
      mobileNumber: data.mobileNumber,
      message: "OTP Sent ✅",
    });
  } catch (error) {
    console.error("Send OTP error:", error.response?.data || error.message);
    return res.status(500).json({ error: error.response?.data || "Failed to send OTP" });
  }
});

// --------------------- VERIFY OTP & SIGNUP ---------------------
router.post("/verify-otp", async (req, res) => {
  const { mobileNumber, countryCode, verificationId, code, name, password, referredBy } = req.body;

  if (!mobileNumber || !countryCode || !verificationId || !code || !name || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Verify OTP with MessageCentral
    const response = await axios.get(
      `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=${countryCode}&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${CUSTOMER_ID}&code=${code}`,
      { headers: { authToken: AUTH_TOKEN } }
    );

    const { responseCode } = response.data;

    if (responseCode !== "200") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ mobile: mobileNumber });
    if (existingUser) {
      return res.status(400).json({ error: "Mobile number already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate userId & referralCode
    const userId = Math.floor(100000 + Math.random() * 900000).toString();
    const referralCode = name.substring(0, 4).toUpperCase() + mobileNumber.slice(-4);

    // Create new user
    const newUser = new User({
      name,
      mobile: mobileNumber,
      password: hashedPassword,
      userId,
      referralCode,
      referredBy: referredBy || null
    });

    await newUser.save();

    return res.status(200).json({
      success: true,
      message: "✅ OTP verified and signup successful",
      userId,
    });
  } catch (err) {
    console.error("Verify OTP & Signup error:", err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || "OTP verification/signup failed" });
  }
});

module.exports = router;
