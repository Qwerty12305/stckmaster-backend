// routes/admin.js
const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

router.post('/login', async (req, res) => {
  console.log("RAW BODY:", req.body);

  const mobile = req.body.mobile;
  const password = req.body.password;

  console.log("MOBILE TYPE:", typeof mobile);
  console.log("MOBILE VALUE:", `[${mobile}]`);

  const admin = await Admin.findOne({ mobile: mobile });

  console.log("ADMIN FOUND:", admin);

  if (!admin) {
    return res.status(401).json({ error: "Admin not found" });
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  console.log("PASSWORD MATCH:", isMatch);

  if (!isMatch) {
    return res.status(401).json({ error: "Wrong password" });
  }

  res.json({ message: "Login success" });
});



module.exports = router;
