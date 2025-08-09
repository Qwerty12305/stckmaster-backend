// routes/user.js
const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Adjust path if needed
const InvestPlan = require("../models/Investplan"); // Adjust path if needed
const Withdraw = require("../models/Withdraw"); // adjust path if needed
const Deposit = require('../models/Deposit');


// GET /api/users - Return all users with selected fields
router.get("/users", async (req, res) => {
  try {
    // Fetch all users with selected fields including 'status'
    const users = await User.find({}, "name mobile userId referralCode referredBy status").lean();

    // Count totals
    const totalUsers = await User.countDocuments(); // ✅ Total number of users
    const totalNoReferrer = await User.countDocuments({ referredBy: null });
    const totalWithReferrer = await User.countDocuments({ referredBy: { $ne: null } });

    res.status(200).json({
      users,
      totalUsers,
      totalNoReferrer,
      totalWithReferrer,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});


//Update users status
router.patch("/users/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Validate status (optional)
    if (!["active", "deactivated"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { status },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Status updated", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});




//total investmaent details
router.get("/investments", async (req, res) => {
  try {
    // Fetch all investments sorted by latest
    const investments = await InvestPlan.find().sort({ createdAt: -1 });

    // Calculate total invested amount and count
    const aggregationResult = await InvestPlan.aggregate([
      {
        $group: {
          _id: null,
          totalInvested: { $sum: "$amount" },
          investmentCount: { $sum: 1 }
        }
      }
    ]);

    const totalInvested = aggregationResult[0]?.totalInvested || 0;
    const investmentCount = aggregationResult[0]?.investmentCount || 0;

    res.json({
      success: true,
      totalInvested,
      investmentCount,
      investments
    });
  } catch (err) {
    console.error("Error fetching investments:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


router.get("/withdrawals", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    // Total withdraw amount
    const totalWithdrawAmountResult = await Withdraw.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);
    const totalWithdrawAmount = totalWithdrawAmountResult[0]?.totalAmount || 0;

    // Pending withdrawals amount and count
    const pendingStats = await Withdraw.aggregate([
      { $match: { status: "pending" } },
      {
        $group: {
          _id: null,
          totalPendingAmount: { $sum: "$amount" },
          pendingCount: { $sum: 1 },
        },
      },
    ]);
    const totalPendingAmount = pendingStats[0]?.totalPendingAmount || 0;
    const pendingCount = pendingStats[0]?.pendingCount || 0;

    // Success withdrawals amount and count
    const successStats = await Withdraw.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalSuccessAmount: { $sum: "$amount" },
          successCount: { $sum: 1 },
        },
      },
    ]);
    const totalSuccessAmount = successStats[0]?.totalSuccessAmount || 0;
    const successCount = successStats[0]?.successCount || 0;

    // All withdrawal details
    const allWithdrawals = await Withdraw.find().sort({ createdAt: -1 });

    res.json({
      totalUsers,
      totalWithdrawAmount,
      totalPendingAmount,
      pendingCount,
      totalSuccessAmount,
      successCount,
      allWithdrawals,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put('/withdrawals/:id/status', async (req, res) => {
  try {
    const withdrawalId = req.params.id;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'success', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Find withdrawal and update status
    const updatedWithdraw = await Withdraw.findByIdAndUpdate(
      withdrawalId,
      { status },
      { new: true } // return updated doc
    );

    if (!updatedWithdraw) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    res.json({ message: 'Status updated successfully', withdrawal: updatedWithdraw });
  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/deposits', async (req, res) => {
  try {
    // Pending deposits stats
    const pendingStats = await Deposit.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: null,
          totalPendingAmount: { $sum: '$amount' },
          pendingCount: { $sum: 1 },
        },
      },
    ]);
    const totalPendingAmount = pendingStats[0]?.totalPendingAmount || 0;
    const pendingCount = pendingStats[0]?.pendingCount || 0;

    // Success deposits stats
    const successStats = await Deposit.aggregate([
      { $match: { status: 'success' } },  // or 'approved' if you use that status
      {
        $group: {
          _id: null,
          totalSuccessAmount: { $sum: '$amount' },
          successCount: { $sum: 1 },
        },
      },
    ]);
    const totalSuccessAmount = successStats[0]?.totalSuccessAmount || 0;
    const successCount = successStats[0]?.successCount || 0;

    // All deposits with full details
    const allDeposits = await Deposit.find().sort({ createdAt: -1 });

    res.json({
      totalPendingAmount,
      pendingCount,
      totalSuccessAmount,
      successCount,
      allDeposits,
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:userId
router.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
router.patch("/deposits/update-by-utr", async (req, res) => {
  const { userId, utrNumber, status } = req.body;

  if (!["success", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const updatedDeposit = await Deposit.findOneAndUpdate(
      { userId, utr: utrNumber },
      { status },
      { new: true }
    );

    if (!updatedDeposit) {
      return res.status(404).json({ error: "Deposit not found" });
    }

    res.json(updatedDeposit);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});





module.exports = router;
