const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  userId: { type: String, unique: true }, // 6-digit ID
  status: { type: String, default: "active" },
  referralCode: { type: String },
  referredBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
