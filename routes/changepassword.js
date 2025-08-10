const express = require("express");
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require("../models/User"); // your User model path
const twilio = require('twilio');


const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;



// Route 1: Verify current password and send OTP
router.post("/verify-current-password-send-otp", async (req, res) => {
  try {
    const { userId, currentPassword } = req.body;
    if (!userId || !currentPassword) {
      return res.status(400).json({ message: "Missing userId or currentPassword" });
    }

    const user = await User.findOne({ userId: userId });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Send OTP via Twilio Verify API
     await client.verify.v2.services(verifySid)
      .verifications
      .create({ to: `+91${user.mobile}`, channel: 'sms' });



    return res.json({ message: "OTP sent to your registered mobile number" });
  } catch (err) {
    console.error("Error in verify-current-password-send-otp:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Route 2: Verify OTP and change password
router.post("/verify-otp-and-change-password", async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ userId: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify OTP with Twilio Verify API
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: `+91${user.mobile}`, // same country code as above
        code: otp,
      });

    if (verificationCheck.status !== "approved") {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash new password and save
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error in verify-otp-and-change-password:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
