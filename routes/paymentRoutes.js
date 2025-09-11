// backend/routes/paymentMethods.js
const express = require("express");
const PaymentMethod = require("../models/PaymentMethod");

const router = express.Router();

// GET all payment methods
router.get("/all", async (req, res) => {
  try {
    const methods = await PaymentMethod.find();
    res.json(methods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/all/:id", async (req, res) => {
  try {
    const pm = await PaymentMethod.findById(req.params.id);
    if (!pm) return res.status(404).json({ message: "Payment method not found" });
    res.json(pm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD new payment method
router.post("/add", async (req, res) => {
  try {
    const { method, bankData, qrData, usdtData } = req.body;

    const newMethod = new PaymentMethod({
      method,
      bankData: bankData || undefined,
      qrData: qrData || undefined,
      usdtData: usdtData || undefined,
    });

    await newMethod.save();
    res.json(newMethod);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add payment method" });
  }
});

// UPDATE payment method
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { method, bankData, qrData, usdtData } = req.body;

    const updated = await PaymentMethod.findByIdAndUpdate(
      id,
      { method, bankData, qrData, usdtData },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update payment method" });
  }
});

// DELETE payment method
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PaymentMethod.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete payment method" });
  }
});

module.exports = router;
