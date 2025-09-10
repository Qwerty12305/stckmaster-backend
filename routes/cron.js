// routes/cronRoutes.js
const router = require('express').Router();
const moment = require('moment-timezone');
const Investplan = require("../models/Investplan");
const { creditIncome } = require('../cron/dailyIncome');

router.get('/run-daily-credit', async (req, res) => {
  try {
    const now = moment().tz('Asia/Kolkata'); // current IST

    // Fetch active plans where nextCreditDate is due
    const investments = await Investplan.find({
      status: 'active',
      nextCreditDate: { $lte: now.toDate() }, // pick plans whose nextCreditDate <= now
    });

    if (investments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No plans are due for crediting today.',
      });
    }

    // Run the credit logic
    await creditIncome();

    return res.json({
      success: true,
      message: 'Daily income credited successfully',
    });
  } catch (err) {
    console.error('Error in /api/run-daily-credit:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
// GET /api/cron/daily-credit-status
router.get('/daily-credit-status', async (req, res) => {
  try {
    const startOfToday = moment().tz('Asia/Kolkata').startOf('day');
    const endOfToday = moment().tz('Asia/Kolkata').endOf('day');

    // Plans that are still due for credit today
    const investments = await Investplan.find({
      status: 'active',
      nextCreditDate: { $gte: startOfToday.toDate(), $lte: endOfToday.toDate() },
    });

    if (investments.length === 0) {
      // No plans due today → already credited
      return res.json({
        success: true,
        credited: true,
        message: '✅ Daily income has already been credited today',
      });
    } else {
      // Plans still pending today
      return res.json({
        success: true,
        credited: false,
        message: '⚠️ Daily income has not been credited yet',
      });
    }
  } catch (err) {
    console.error('Error in /api/cron/daily-credit-status:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



module.exports = router;
