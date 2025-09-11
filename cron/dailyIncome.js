const cron = require('node-cron');
const moment = require('moment-timezone');
const InvestPlan = require('../models/Investplan');

async function creditIncome() {
  try {
    const now = moment().tz('Asia/Kolkata').toDate(); // current IST

    // Find all active plans where nextCreditDate <= now and not fully credited
    const plans = await InvestPlan.find({
      status: 'active',
      nextCreditDate: { $lte: now },
      $expr: { $lt: ['$creditedDays', '$duration'] }
    });

    if (plans.length === 0) return;

    for (const plan of plans) {
      // Credit daily income
      plan.earnedIncome += plan.dailyIncome;
      plan.creditedDays += 1;

      // Move nextCreditDate to the next weekday at 12:00 PM IST
      let nextDate = moment(plan.nextCreditDate).tz('Asia/Kolkata').add(1, 'day');
      const day = nextDate.isoWeekday(); // 1 = Monday, ..., 7 = Sunday

      if (day === 6) nextDate.add(2, 'days'); // Saturday -> Monday
      if (day === 7) nextDate.add(1, 'day');  // Sunday -> Monday

      plan.nextCreditDate = nextDate.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).toDate();

      // Mark plan as completed if all days credited
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
  // Run every day at 12:00 PM IST, the function itself will skip weekends automatically
  cron.schedule('0 12 * * *', async () => {
    await creditIncome();
  }, { timezone: 'Asia/Kolkata' });
}

module.exports = { startDailyIncomeCron, creditIncome };
