const mongoose = require("mongoose");



const depositSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  realamount: { type: Number, required: true },
  amount: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  utr: { type: String, required: true },
  status: { type: String, default: "pending" },
  referredBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});


//recharge history


module.exports = mongoose.model("Deposit", depositSchema);
