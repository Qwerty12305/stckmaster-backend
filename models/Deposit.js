const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  utr: { type: String, required: true },
  status: { type: String, default: "pending" }, // pending | approved | rejected
  referredBy: { type: String, default: null },  // Add this
  createdAt: { type: Date, default: Date.now },
});

//recharge history


module.exports = mongoose.model("Deposit", depositSchema);
