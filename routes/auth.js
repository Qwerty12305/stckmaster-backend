require('dotenv').config();
const express = require("express");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

const AUTH_TOKEN = process.env.MESSAGECENTRAL_AUTH_TOKEN;
const CUSTOMER_ID = process.env.MESSAGECENTRAL_CUSTOMER_ID;

if (!AUTH_TOKEN || !CUSTOMER_ID) {
  console.warn("⚠️ MESSAGECENTRAL_AUTH_TOKEN or CUSTOMER_ID missing!");
}

// --------------------- SEND OTP ---------------------
// --------------------- SEND OTP ---------------------
router.post("/send-otp", async (req, res) => {
  let { mobileNumber, countryCode } = req.body;

  if (!mobileNumber || !countryCode) {
    return res.status(400).json({ success: false, error: "Mobile number & country code required" });
  }

  // Normalize mobile number
  mobileNumber = mobileNumber.toString().trim();

  try {
    // ✅ Check if mobile already exists BEFORE sending OTP
    const existingUser = await User.findOne({ mobile: mobileNumber });
    if (existingUser) {
      console.log("Mobile already exists:", mobileNumber);
      return res.status(400).json({ success: false, error: "Mobile number already registered ❌" });
    }

    // Send OTP via MessageCentral
    const response = await axios.post(
      `https://cpaas.messagecentral.com/verification/v3/send?countryCode=${countryCode}&customerId=${CUSTOMER_ID}&flowType=SMS&mobileNumber=${mobileNumber}`,
      {},
      { headers: { authToken: AUTH_TOKEN } }
    );

    const data = response.data.data;
    if (!data?.verificationId) {
      return res.status(500).json({ success: false, error: "Failed to generate OTP" });
    }

    return res.status(200).json({
      success: true,
      verificationId: data.verificationId,
      mobileNumber: data.mobileNumber,
      message: "OTP Sent ✅",
      timeout: 300
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Failed to send OTP" });
  }
});


// --------------------- VERIFY OTP & SIGNUP ---------------------
router.post("/verify-otp", async (req, res) => {
  let { mobileNumber, countryCode, verificationId, code, name, password, referredBy } = req.body;

  if (!mobileNumber || !countryCode || !verificationId || !code || !name || !password) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  // Normalize mobile number
  mobileNumber = mobileNumber.trim();

  try {
    // ✅ Verify OTP with MessageCentral
    const otpResponse = await axios.get(
      `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=${countryCode}&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${CUSTOMER_ID}&code=${code}`,
      { headers: { authToken: AUTH_TOKEN } }
    );

    const { responseCode, message, data } = otpResponse.data;

    if (responseCode === 200 && data?.verificationStatus === "VERIFICATION_COMPLETED") {
      // ✅ Check again if user exists before creating
      const existingUser = await User.findOne({ mobile: mobileNumber });
      if (existingUser) {
        return res.status(400).json({ success: false, error: "Mobile number already registered ❌" });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = Math.floor(100000 + Math.random() * 900000).toString();
      const referralCode = name.substring(0, 4).toUpperCase() + mobileNumber.slice(-4);

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
        userId
      });

    } else if (responseCode === 702) {
      return res.status(400).json({ success: false, error: "Wrong OTP provided ❌" });
    } else if (responseCode === 705) {
      return res.status(400).json({ success: false, error: "OTP expired ❌" });
    } else {
      return res.status(400).json({ success: false, error: message || "OTP verification failed ❌" });
    }

  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ success: false, error: "Server error during OTP verification" });
  }
});

module.exports = router;
