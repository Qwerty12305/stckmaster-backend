require('dotenv').config();
const express = require("express");
const bcrypt = require('bcryptjs');
const axios = require("axios");
const router = express.Router();
const User = require("../models/User"); // your User model path

const AUTH_TOKEN = process.env.MESSAGECENTRAL_AUTH_TOKEN;
const CUSTOMER_ID = process.env.MESSAGECENTRAL_CUSTOMER_ID;

if (!AUTH_TOKEN || !CUSTOMER_ID) {
  console.warn("⚠️ MESSAGECENTRAL_AUTH_TOKEN or CUSTOMER_ID missing!");
}

const COUNTRY_CODE = "91"; // Hardcoded country code

// --------------------- Route 1: Verify current password and send OTP ---------------------
router.post("/verify-current-password-send-otp", async (req, res) => {
  try {
    const { userId, currentPassword } = req.body;
    if (!userId || !currentPassword) {
      return res.status(400).json({ message: "Missing userId or currentPassword" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Send OTP via MessageCentral
    const response = await axios.post(
      `https://cpaas.messagecentral.com/verification/v3/send?countryCode=${COUNTRY_CODE}&customerId=${CUSTOMER_ID}&flowType=SMS&mobileNumber=${user.mobile}`,
      {},
      { headers: { authToken: AUTH_TOKEN } }
    );

    const data = response.data.data;
    if (!data?.verificationId) {
      return res.status(500).json({ message: "Failed to generate OTP" });
    }

    return res.json({
      message: "OTP sent to your registered mobile number",
      verificationId: data.verificationId
    });

  } catch (err) {
    console.error("Error in verify-current-password-send-otp:", err.response?.data || err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------- Route 2: Verify OTP and change password ---------------------
router.post("/verify-otp-and-change-password", async (req, res) => {
  try {
    const { userId, otp, newPassword, verificationId } = req.body;
    if (!userId || !otp || !newPassword || !verificationId) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify OTP via MessageCentral
    const otpResponse = await axios.get(
      `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=${COUNTRY_CODE}&mobileNumber=${user.mobile}&verificationId=${verificationId}&customerId=${CUSTOMER_ID}&code=${otp}`,
      { headers: { authToken: AUTH_TOKEN } }
    );

    const { responseCode, data } = otpResponse.data;

    if (responseCode === 200 && data?.verificationStatus === "VERIFICATION_COMPLETED") {
      // Hash new password and save
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return res.json({ message: "Password changed successfully" });
    } else if (responseCode === 702) {
      return res.status(400).json({ message: "Invalid OTP" });
    } else if (responseCode === 705) {
      return res.status(400).json({ message: "OTP expired" });
    } else {
      return res.status(400).json({ message: "OTP verification failed" });
    }

  } catch (err) {
    console.error("Error in verify-otp-and-change-password:", err.response?.data || err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
