const cron = require("node-cron");
const moment = require("moment-timezone");
const Investplan = require("../models/Investplan");

// Schedule the cron job to run daily at 12:30 PM IST (which is 7:00 AM UTC)
cron.schedule("30 6 * * *", async () => {
  try {
    const now = new Date();

    // Find active plans whose nextCreditDate is due and creditedDays < duration
    const plans = await Investplan.find({
      status: "active",
      nextCreditDate: { $lte: now },
      $expr: { $lt: ["$creditedDays", "$duration"] },
    });

    if (plans.length === 0) {
      console.log("📭 No plans due for daily income credit today.");
      return;
    }

    const updatePromises = plans.map((plan) => {
      plan.earnedIncome += plan.dailyIncome;
      plan.creditedDays += 1;

      // Set nextCreditDate to next day at 12:00 PM IST
      plan.nextCreditDate = moment(plan.nextCreditDate)
        .tz("Asia/Kolkata")
        .startOf("day")
        .add(1, "day")
        .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
        .utc()
        .toDate();

      if (plan.creditedDays >= plan.duration) {
        plan.status = "completed";
      }

      return plan.save();
    });

    await Promise.all(updatePromises);
    console.log(`✅ Daily income credited for ${plans.length} plan(s).`);
  } catch (error) {
    console.error("❌ Error in daily income cron job:", error);
  }
});
