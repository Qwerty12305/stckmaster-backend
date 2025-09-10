const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const PaymentMethod = require("../models/PaymentMethod");
const fs = require("fs").promises;

// Setup multer storage for QR/USDT image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/qr_codes"); // ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  },
});
const upload = multer({ storage });

// GET all payment methods
router.get("/all", async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find();
    res.json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET payment method by ID
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

// POST add payment method
router.post("/add", upload.single("qrFile"), async (req, res) => {
  try {
    const { method } = req.body;
    let newEntry;

    if (method === "bank") {
      const { customerName, bankName, accountNumber, ifsc } = req.body;
      newEntry = new PaymentMethod({
        method,
        bankData: { customerName, bankName, accountNumber, ifsc },
      });
    } else if (method === "qr") {
      const { upiId } = req.body;
      const qrFile = req.file ? req.file.filename : null;
      newEntry = new PaymentMethod({
        method,
        qrData: { upiId, qrFile },
      });
    } else if (method === "usdt") {
      const { network } = req.body;
      const qrFile = req.file ? req.file.filename : null;
      newEntry = new PaymentMethod({
        method,
        usdtData: { network, qrFile },
      });
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    await newEntry.save();
    res.json({ message: "Payment method added successfully", data: newEntry });
  } catch (err) {
    console.error("Error adding payment method:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Account Number already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update payment method
// PUT update payment method
router.put("/update/:id", upload.single("qrFile"), async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body;

    const existing = await PaymentMethod.findById(id);
    if (!existing) return res.status(404).json({ message: "Payment method not found" });

    const updateData = { method }; // <-- remove ": any"

    if (method === "bank") {
      const { customerName, bankName, accountNumber, ifsc } = req.body;
      updateData.bankData = { customerName, bankName, accountNumber, ifsc };
      updateData.qrData = undefined;
      updateData.usdtData = undefined;
    } else if (method === "qr") {
      const { upiId } = req.body;
      updateData.qrData = {
        upiId,
        qrFile: req.file ? req.file.filename : existing.qrData?.qrFile || null,
      };
      updateData.bankData = undefined;
      updateData.usdtData = undefined;
    } else if (method === "usdt") {
      const { network } = req.body;
      updateData.usdtData = {
        network,
        qrFile: req.file ? req.file.filename : existing.usdtData?.qrFile || null,
      };
      updateData.bankData = undefined;
      updateData.qrData = undefined;
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const updated = await PaymentMethod.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ message: "Payment method updated", paymentMethod: updated });
  } catch (error) {
    console.error("Error updating payment method:", error);
    res.status(500).json({ message: "Server error during update" });
  }
});


// DELETE payment method
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const methodToDelete = await PaymentMethod.findById(id);
    if (!methodToDelete) return res.status(404).json({ message: "Payment method not found" });

    // Remove QR file if exists
    if (methodToDelete.qrData?.qrFile) {
      const qrPath = path.resolve(__dirname, "../uploads/qr_codes", methodToDelete.qrData.qrFile);
      try { await fs.unlink(qrPath); } catch (err) { console.error("Failed to delete QR file:", err); }
    }

    // Remove USDT file if exists
    if (methodToDelete.usdtData?.qrFile) {
      const usdtPath = path.resolve(__dirname, "../uploads/qr_codes", methodToDelete.usdtData.qrFile);
      try { await fs.unlink(usdtPath); } catch (err) { console.error("Failed to delete USDT QR file:", err); }
    }

    await PaymentMethod.findByIdAndDelete(id);
    res.json({ message: "Payment method deleted" });
  } catch (error) {
    console.error("Delete payment method error:", error);
    res.status(500).json({ message: "Server error deleting payment method" });
  }
});

module.exports = router;
