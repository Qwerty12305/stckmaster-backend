const cron = require('node-cron');
const moment = require('moment-timezone');
const InvestPlan = require('../models/Investplan');

async function creditIncome() {
  try {
    const now = moment().tz('Asia/Kolkata').toDate(); // current IST

    const plans = await InvestPlan.find({
      status: 'active',
      nextCreditDate: { $lte: now },
      $expr: { $lt: ['$creditedDays', '$duration'] }
    });

    if (plans.length === 0) return;

    for (const plan of plans) {
      plan.earnedIncome += plan.dailyIncome;
      plan.creditedDays += 1;

      // Move nextCreditDate to the next day at 12:00 PM IST
      plan.nextCreditDate = moment(plan.nextCreditDate)
        .tz('Asia/Kolkata')
        .add(1, 'day')
        .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
        .toDate();

      if (plan.creditedDays >= plan.duration) {
        plan.status = 'completed';
      }

      await plan.save();
    }
  } catch (err) {
    console.error('Error in creditIncome:', err);
  }
}

function startDailyIncomeCron() {
  cron.schedule('0 12 * * 1-5', async () => { // Monday–Friday at 12:00 PM IST
    await creditIncome();
  }, { timezone: 'Asia/Kolkata' });
}

module.exports = { startDailyIncomeCron, creditIncome };
