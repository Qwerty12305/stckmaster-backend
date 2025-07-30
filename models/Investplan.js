const mongoose = require("mongoose");

const investPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  dailyIncome: { type: Number, required: true },
  totalIncome: { type: Number, required: true },
  duration: { type: Number, required: true }, // days
  status: { type: String, default: "active" }, // active or completed
  createdAt: { type: Date, default: Date.now },
  nextCreditDate: {
    type: Date,
    default: () => {
      const now = new Date();
      // Set nextCreditDate to next day 12:00 PM IST (6:30 AM UTC)
      const tomorrowNoonIST = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          6, 30, 0, 0
        )
      );
      return tomorrowNoonIST;
    },
  },
  creditedDays: { type: Number, default: 0 },
  earnedIncome: { type: Number, default: 0 },
});

module.exports = mongoose.models.InvestPlan || mongoose.model("Investplan", investPlanSchema);

