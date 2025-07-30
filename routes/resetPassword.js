const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

router.post('/reset-password', async (req, res) => {
  const { mobile, otp, newPassword } = req.body;

  if (!mobile || !otp || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Verify OTP using Twilio Verify
    const verificationCheck = await client.verify.v2.services(verifySid)
      .verificationChecks
      .create({ to: `+91${mobile}`, code: otp });

    if (verificationCheck.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // OTP verified, now update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { mobile },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
