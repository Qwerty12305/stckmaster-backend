const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

      const now = new Date();

const tomorrowNoonIST = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          6, 30, 0, 0
        )
      );

console.log("🕒 Current IST Time:", tomorrowNoonIST);


router.post('/signin', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ message: 'Mobile and password required' });
  }

  try {
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({
      message: '✅ Login successful',
      userId: user.userId,
      name: user.name,
    });
  } catch (error) {
    console.error('❌ Signin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
