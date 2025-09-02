require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

const CUSTOMER_ID = process.env.MESSAGECENTRAL_CUSTOMER_ID;
const AUTH_TOKEN = process.env.MESSAGECENTRAL_AUTH_TOKEN;

// In-memory store just to track verificationId expiry (optional)
const otpStore = {};

// ----------------- SEND OTP -----------------
router.post('/forgot-password', async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Valid 10-digit mobile required' });
  }

  try {
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Send OTP via MessageCentral
    const response = await axios.post(
      `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&customerId=${CUSTOMER_ID}&flowType=SMS&mobileNumber=${mobile}`,
      {},
      { headers: { authToken: AUTH_TOKEN } }
    );

    const verificationId = response.data?.data?.verificationId;
    if (!verificationId) return res.status(500).json({ error: 'Failed to generate OTP' });

    // Optional: store verificationId for expiry tracking
    otpStore[mobile] = { verificationId, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 min

    res.status(200).json({
      message: 'OTP sent successfully',
      verificationId,
      mobileNumber: mobile,
      timeout: 300
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ----------------- VERIFY OTP & RESET PASSWORD -----------------
router.post('/verify-otp', async (req, res) => {
  const { mobile, verificationId, code, newPassword } = req.body;

  if (!mobile || !verificationId || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const record = otpStore[mobile];
  if (!record || record.verificationId !== verificationId || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  try {
    // Verify OTP via MessageCentral
    const otpResponse = await axios.get(
      `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=91&mobileNumber=${mobile}&verificationId=${verificationId}&customerId=${CUSTOMER_ID}&code=${code}`,
      { headers: { authToken: AUTH_TOKEN } }
    );

    const { responseCode, data } = otpResponse.data;

    if (responseCode === 200 && data?.verificationStatus === 'VERIFICATION_COMPLETED') {
      // Reset password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate({ mobile }, { password: hashedPassword });

      // Remove OTP record
      delete otpStore[mobile];

      return res.status(200).json({ message: 'Password reset successfully ✅' });
    } else {
      return res.status(400).json({ error: 'OTP verification failed ❌' });
    }

  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ error: 'Server error during OTP verification' });
  }
});

module.exports = { router, otpStore };
