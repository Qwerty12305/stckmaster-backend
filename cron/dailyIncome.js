const cron = require("node-cron");
const InvestPlan = require("../models/Investplan");

cron.schedule("30 6 * * *", async () => {
  console.log("Running daily income update cron job at 12:00 PM IST (6:30 AM UTC)");

  try {
    const now = new Date();

    // Find active plans whose nextCreditDate is due and creditedDays less than duration
    const plans = await InvestPlan.find({
      status: "active",
      nextCreditDate: { $lte: now },
      $expr: { $lt: ["$creditedDays", "$duration"] },
    });

    if (plans.length === 0) {
      console.log("No plans due for daily income credit today.");
      return;
    }

    const updatePromises = plans.map((plan) => {
      plan.earnedIncome += plan.dailyIncome;
      plan.creditedDays += 1;

      // Next credit date: add 24 hours (keep same 12:00 PM IST logic)
      plan.nextCreditDate = new Date(plan.nextCreditDate.getTime() + 24 * 60 * 60 * 1000);

      if (plan.creditedDays >= plan.duration) {
        plan.status = "completed";
      }

      return plan.save();
    });

    await Promise.all(updatePromises);
    console.log(`✅ Daily income updated for ${plans.length} plans.`);
  } catch (error) {
    console.error("❌ Error during daily income update cron job:", error);
  }
});
