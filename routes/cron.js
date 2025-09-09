const router = require('express').Router();
const { creditIncome } = require('../cron/dailyIncome');

router.get('/run-daily-credit', async (req, res) => {
  try {
    await creditIncome();
    res.json({ success: true, message: "Daily income credited successfully" });
  } catch (err) {
    console.error("Error in /api/run-daily-credit:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
