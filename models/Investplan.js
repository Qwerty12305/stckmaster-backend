// NEW InvestPlan.js - Verified Working Version
const mongoose = require('mongoose');
const path = require('path');

// Debugging
console.log('InvestPlan model loading from:', path.resolve(__dirname));

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
    default: () => {
      const moment = require('moment-timezone');
      return moment()
        .tz('Asia/Kolkata')
        .startOf('day')
        .add(1, 'day')
        .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
        .utc()
        .toDate();
    } 
  },
  creditedDays: { type: Number, default: 0 },
  earnedIncome: { type: Number, default: 0 }
});

const Model = mongoose.models.InvestPlan || mongoose.model('InvestPlan', investPlanSchema);
console.log('InvestPlan model registered:', Model.modelName);

module.exports = Model;
