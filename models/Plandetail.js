const mongoose = require("mongoose");



const planSchema = new mongoose.Schema({
  planId: { type: String, required: true }, // 🔄 removed 'unique: true'
  planName: { type: String, required: true },
  period: { type: String, required: true },
  amount: { type: String, required: true },
  dailyIncome: { type: String, required: true },
  totalIncome: { type: String, required: true },
});

module.exports = mongoose.model("Plandetail", planSchema);
