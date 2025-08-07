const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  mobile: { type: String, unique: true },
  password: String,
  userId: { type: String, unique: true }, // 6-digit ID (e.g., 245612)
  status: { type: String, default: "active" },
  referralCode: { type: String },      // Add this
  referredBy: { type: String, default: null }  // Add this
});

module.exports = mongoose.model('User', userSchema);
