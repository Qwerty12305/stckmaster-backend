const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PaymentMethod = require("../models/PaymentMethod");

// Multer storage for QR/USDT images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/qr_codes");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

// Get all payment methods
router.get("/all", async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find().sort({ createdAt: -1 });
    res.json(paymentMethods);
  } catch (err) {
    console.error("Error fetching payment methods:", err);
    res.status(500).json({ error: "Failed to fetch payment methods" });
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

router.get("/all/:id", async (req, res) => { 
  try { const pm = await PaymentMethod.findById(req.params.id); 
    if (!pm) return 
    res.status(404).json({ message: "Payment method not found" });
     res.json(pm); } catch (error)
      { console.error(error); res.status(500).json({ message: "Server error" }); 
    
    } });

// Add payment method
router.post("/add", upload.single("qrFile"), async (req, res) => {
  try {
    const { method } = req.body;
    let newEntry;

    if (method === "bank") {
      const { customerName, bankName, accountNumber, ifsc } = req.body;
      newEntry = new PaymentMethod({ method, bankData: { customerName, bankName, accountNumber, ifsc } });
    } else if (method === "qr") {
      const { upiId } = req.body;
      const qrFile = req.file ? req.file.filename : null;
      newEntry = new PaymentMethod({ method, qrData: { upiId, qrFile } });
    } else if (method === "usdt") {
      const { network } = req.body;
      const qrFile = req.file ? req.file.filename : null;
      newEntry = new PaymentMethod({ method, usdtData: { network, qrFile } });
    } else {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    await newEntry.save();
    res.json({ message: "Payment method added successfully", data: newEntry });
  } catch (err) {
    console.error("Error adding payment method:", err);
    res.status(500).json({ error: "Failed to add payment method" });
  }
});

// Update payment method
router.put("/update/:id", upload.single("qrFile"), async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body;

    const existing = await PaymentMethod.findById(id);
    if (!existing) return res.status(404).json({ error: "Payment method not found" });

    const updateData = { method };

    if (method === "bank") {
      const { customerName, bankName, accountNumber, ifsc } = req.body;
      updateData.bankData = { customerName, bankName, accountNumber, ifsc };
      updateData.qrData = undefined;
      updateData.usdtData = undefined;
    } else if (method === "qr") {
      const { upiId } = req.body;
      if (req.file && existing.qrData?.qrFile) {
        // Delete old file
        const oldPath = path.join(__dirname, "../uploads/qr_codes", existing.qrData.qrFile);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.qrData = { upiId, qrFile: req.file ? req.file.filename : existing.qrData?.qrFile || null };
      updateData.bankData = undefined;
      updateData.usdtData = undefined;
    } else if (method === "usdt") {
      const { network } = req.body;
      if (req.file && existing.usdtData?.qrFile) {
        const oldPath = path.join(__dirname, "../uploads/qr_codes", existing.usdtData.qrFile);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.usdtData = { network, qrFile: req.file ? req.file.filename : existing.usdtData?.qrFile || null };
      updateData.bankData = undefined;
      updateData.qrData = undefined;
    } else {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const updated = await PaymentMethod.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ message: "Payment method updated successfully", data: updated });
  } catch (err) {
    console.error("Error updating payment method:", err);
    res.status(500).json({ error: "Failed to update payment method" });
  }
});

// Delete payment method
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const methodToDelete = await PaymentMethod.findById(id);
    if (!methodToDelete) return res.status(404).json({ error: "Payment method not found" });

    // Delete QR/USDT files if exist
    const filesToDelete = [];
    if (methodToDelete.qrData?.qrFile) filesToDelete.push(path.join(__dirname, "../uploads/qr_codes", methodToDelete.qrData.qrFile));
    if (methodToDelete.usdtData?.qrFile) filesToDelete.push(path.join(__dirname, "../uploads/qr_codes", methodToDelete.usdtData.qrFile));

    filesToDelete.forEach((filePath) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await PaymentMethod.findByIdAndDelete(id);
    res.json({ message: "Payment method deleted successfully" });
  } catch (err) {
    console.error("Error deleting payment method:", err);
    res.status(500).json({ error: "Failed to delete payment method" });
  }
});

module.exports = router;
