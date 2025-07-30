const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  account: {
    type: String,
    required: true,
  },
  ifscCode: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Withdraw", withdrawSchema);
