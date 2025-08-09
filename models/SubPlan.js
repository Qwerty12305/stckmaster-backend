const mongoose = require('mongoose');

const subPlanSchema = new mongoose.Schema({
  subPlanName: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  lockingPeriod: {
    type: Number, // in days or months, based on your logic
    required: true,
  },
  percentage: {
    type: Number, // interest or return percentage
    required: true,
    min: 1,
    max: 20,
  },
  percentageAmount: {
  type: Number,
  required: true,
},
  parentPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
}, { timestamps: true });

const SubPlan = mongoose.model('SubPlan', subPlanSchema);

module.exports = SubPlan;
