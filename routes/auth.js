require('dotenv').config(); // At the top if not already
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const twilio = require('twilio');
const User = require('../models/User');

const Deposit = require('../models/Deposit'); // make sure you have Deposit model

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

// ✅ Step 1: Send OTP
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || mobile.length !== 10) {
    return res.status(400).json({ error: 'Invalid mobile number' });
  }

  try {
    await client.verify.v2.services(verifySid)
      .verifications
      .create({ to: `+91${mobile}`, channel: 'sms' });

    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});


// ✅ Step 2: Verify OTP & Signup
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp, name, password, referredBy } = req.body;

  if (!mobile || !otp || !name || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Verify OTP
    const verification = await client.verify.v2.services(verifySid)
      .verificationChecks
      .create({ to: `+91${mobile}`, code: otp });

    if (verification.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ error: 'Mobile number already registered' });
    }

    // Hash password & generate userId
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate referralCode
    const referralCode = name.substring(0, 4).toUpperCase() + mobile.slice(-4);

    // Save new user
    const newUser = new User({
      name,
      mobile,
      password: hashedPassword,
      userId,
      referralCode,
      referredBy: referredBy || null
    });

    await newUser.save();

    // ✅ Add first-time signup bonus
    const bonusAmount = 100;
    const randomUTR = Math.floor(10000000000000 + Math.random() * 90000000000000).toString(); // 14-digit

    const bonusDeposit = new Deposit({
      userId,
      amount: bonusAmount,
      utr: randomUTR,
      status: 'success',
      referredBy: referredBy || null,
      createdAt: new Date(),
    });

    await bonusDeposit.save();

    res.json({ success: true, message: 'Signup successful', userId });
  } catch (err) {
    console.error('Verify OTP error:', err);

    if (err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate user or referralCode' });
    }

    res.status(500).json({ error: 'Signup failed' });
  }
});



module.exports = router;
