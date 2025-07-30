const mongoose = require("mongoose");

const bankSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  customerName: { type: String, required: true },
  bankName: { type: String, required: true },
  account: { type: String, required: true },
  ifsc: { type: String, required: true },
});

module.exports = mongoose.model("Bank", bankSchema);
