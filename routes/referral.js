// Assuming you have User model imported
const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Adjust path
const Deposit = require("../models/Deposit");

// GET referral code by userId (string)
router.get("/byUserId/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId }); // userId is string in your db

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log("referralCode is:", user.referralCode);
    res.json({ referralCode: user.referralCode });
  } catch (error) {
    console.error("Error fetching referral code:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// GET referral earnings summary
// GET referral earnings summary with reward calculation
router.get("/earnings/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1. Get referral code from User model
    const user = await User.findOne({ userId });
    if (!user || !user.referralCode) {
      return res.status(404).json({ message: "Referral code not found" });
    }

    const referralCode = user.referralCode;

    // 2. Find all successful deposits made using this referral code
    const deposits = await Deposit.find({
      referredBy: referralCode,
      status: "success",
    });

    // 3. Calculate earnings
    let totalEarnings = 0;
    let rewardDetails = [];

    deposits.forEach((deposit, index) => {
      const percentage = index < 5 ? 0.05 : 0.07; // 5% for first 5, then 7%
      const earning = deposit.realamount * percentage;

      rewardDetails.push({
        userId: deposit.userId,
        depositId: deposit._id,
        amount: deposit.realamount,
        rewardPercentage: percentage * 100,
        earning: parseFloat(earning.toFixed(2)),
      });

      totalEarnings += earning;
    });

    res.json({
      referralCode,
      date: deposits.length > 0 
    ? new Date(deposits[0].createdAt).toISOString().split("T")[0] 
    : null,

      totalReferredUsers: deposits.length,
      totalReferredAmount: deposits.reduce((acc, d) => acc + d.realamount, 0),
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      rewardDetails,
    });
  } catch (error) {
    console.error("Error in referral earnings route:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/team/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Get the referral code of this user
    const user = await User.findOne({ userId });
    if (!user || !user.referralCode) {
      return res
        .status(404)
        .json({ message: "Referral code not found for user" });
    }

    // 2. Find users who signed up with this referral code
    const teamMembers = await User.find({
      referredBy: user.referralCode,
    }).select("userId name mobile createdAt");

    res.json({
      referralCode: user.referralCode,
      teamSize: teamMembers.length,
      members: teamMembers,
    });
  } catch (err) {
    console.error("❌ Team fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//admin Team Table\
router.get("/teamCalculationAdmin/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Step 1: Get the referral code of this user
    const referrer = await User.findOne({ userId });
    if (!referrer) return res.status(404).json({ error: "User not found" });

    const referralCode = referrer.referralCode;

    // Step 2: Find users who used this referral code
    const referredUsers = await User.find({ referredBy: referralCode });

    // Step 3: For each referred user, fetch their successful deposits
    const team = await Promise.all(
      referredUsers.map(async (user) => {
        const successfulDeposits = await Deposit.find({
          userId: user.userId,
          status: "success",
        });

        if (successfulDeposits.length === 0) return null; // Skip users with no success deposits

        const deposits = successfulDeposits.map((dep) => {
          const rewardPercent = 5;
          const earning = (dep.amount * rewardPercent) / 100;

          return {
            _id: dep._id,
            amount: dep.amount,
            utr: dep.utr,
            rewardPercent,
            earning,
          };
        });

        return {
          _id: user._id,
          name: user.name,
          mobile: user.mobile,
          userId: user.userId,
          deposits,
        };
      })
    );

    const filteredTeam = team.filter((member) => member !== null);

    res.json({
      referralCode,
      teamSize: filteredTeam.length,
      members: filteredTeam,
    });

  } catch (err) {
    console.error("Error fetching team info:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;














