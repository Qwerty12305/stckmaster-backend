const mongoose = require('mongoose');
const moment = require('moment-timezone');

const investPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  dailyIncome: { type: Number, required: true },
  totalIncome: { type: Number, required: true },
  duration: { type: Number, required: true },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  nextCreditDate: {
  type: Date,
  default: () => moment().tz('Asia/Kolkata')
    .startOf('day')          // today 00:00 IST
    .add(1, 'day')           // tomorrow 00:00 IST
    .set({ hour: 12 })       // tomorrow 12:00 PM IST
    .minute(0).second(0).millisecond(0)
    .toDate()
},
  creditedDays: { type: Number, default: 0 },
  earnedIncome: { type: Number, default: 0 }
});

const InvestPlan = mongoose.models.InvestPlan || mongoose.model('InvestPlan', investPlanSchema);

module.exports = InvestPlan;
