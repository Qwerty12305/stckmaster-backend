const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');



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

    // ✅ Check if user status is "active"
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is deactivated. Please contact support.' });
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
