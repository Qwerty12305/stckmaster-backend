const cron = require('node-cron');
const moment = require('moment-timezone');
const InvestPlan = require('../models/Investplan');

async function creditIncome() {
  try {
    const now = new Date();

    const plans = await InvestPlan.find({
      status: 'active',
      nextCreditDate: { $lte: now },
      $expr: { $lt: ['$creditedDays', '$duration'] }
    });

    if (plans.length === 0) {
      console.log(`[${now.toISOString()}] No plans to credit.`);
      return;
    }

    for (const plan of plans) {
      console.log(`Crediting plan ${plan._id}: Before creditedDays=${plan.creditedDays}, earnedIncome=${plan.earnedIncome}`);

      plan.earnedIncome += plan.dailyIncome;
      plan.creditedDays += 1;

      plan.nextCreditDate = moment(plan.nextCreditDate)
        .tz('Asia/Kolkata')
        .add(1, 'day')
        .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
        .toDate();

      if (plan.creditedDays >= plan.duration) {
        plan.status = 'completed';
        console.log(`Plan ${plan._id} completed.`);
      }

      await plan.save();

      console.log(`After creditedDays=${plan.creditedDays}, earnedIncome=${plan.earnedIncome}, nextCreditDate=${plan.nextCreditDate}`);
    }
  } catch (err) {
    console.error('Error in creditIncome:', err);
  }
}

function startDailyIncomeCron() {
  // Runs daily at 12:00 PM IST
  cron.schedule('30 6 * * *', async () => {
    console.log("🔄 Running daily income credit...");
    await creditIncome();
  });
  console.log("✅ Daily income cron started");
}

module.exports = startDailyIncomeCron;
