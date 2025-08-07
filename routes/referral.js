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
      status: "success"
    });

    // 3. Calculate earnings
    let totalEarnings = 0;
    let rewardDetails = [];

    deposits.forEach((deposit, index) => {
      const percentage = index < 5 ? 0.05 : 0.07; // 5% for first 5, then 7%
      const earning = deposit.amount * percentage;

      rewardDetails.push({
        depositId: deposit._id,
        amount: deposit.amount,
        rewardPercentage: percentage * 100,
        earning: parseFloat(earning.toFixed(2)),
      });

      totalEarnings += earning;
    });

    res.json({
      referralCode,
      totalReferredUsers: deposits.length,
      totalReferredAmount: deposits.reduce((acc, d) => acc + d.amount, 0),
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      rewardDetails
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
      return res.status(404).json({ message: "Referral code not found for user" });
    }

    // 2. Find users who signed up with this referral code
    const teamMembers = await User.find({ referredBy: user.referralCode }).select(
      "userId name mobile createdAt"
    );

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
router.get("/adminTeam/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Get the main user’s referral code
    const referrer = await User.findById(userId);
    if (!referrer) {
      return res.status(404).json({ message: "User not found" });
    }

    const referralCode = referrer.referralCode;

    // 2. Get all users who were referred by this code
    const members = await User.find({ referredBy: referralCode });

    // 3. Build response with deposit info
    const teamMembers = await Promise.all(
      members.map(async (member) => {
        const deposits = await Deposit.find({ userId: member._id });

        const depositData = deposits.map((dep) => {
          const rewardPercent = 5;
          const earning = (dep.amount * rewardPercent) / 100;

          return {
            _id: dep._id,
            amount: dep.amount,
            rewardPercent,
            earning,
          };
        });

        return {
          _id: member._id,
          name: member.name,
          mobile: member.mobile,
          userId: member.userId,
          deposits: depositData,
        };
      })
    );

    // 4. Send structured response
    res.json({
      referralCode,
      teamSize: teamMembers.length,
      members: teamMembers,
    });
  } catch (err) {
    console.error("Error fetching team info:", err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
