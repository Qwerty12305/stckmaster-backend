const express = require('express');
const router = express.Router();
const User = require('../models/User');
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

const otpStore = {}; // still keeping in-memory store for OTP expiry tracking

router.post('/forgot-password', async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Valid 10-digit mobile required' });
  }

  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use Twilio Verify service to send OTP
    await client.verify.v2.services(verifySid)
      .verifications
      .create({ to: `+91${mobile}`, channel: 'sms' });

    // Save to local store just for expiry tracking (optional)
    otpStore[mobile] = { expiresAt: Date.now() + 5 * 60 * 1000 };

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

module.exports = { router, otpStore };
