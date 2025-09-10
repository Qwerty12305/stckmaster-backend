const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const PaymentMethod = require("../models/PaymentMethod");
const fs = require("fs");
const path = require("path");

// ⚠️ Do NOT call cloudinary.config() if using CLOUDINARY_URL in env

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "qr_codes",
    format: async (_req, file) => file.mimetype.split("/")[1],
    public_id: (_req, _file) => Date.now().toString(),
  },
});

const upload = multer({ storage });

// ---------------------- POST add payment method ----------------------
router.post("/add", upload.single("qrFile"), async (req, res) => {
  try {
    console.log("📥 Incoming request body:", req.body);
    console.log("📁 Incoming file:", req.file);

    const { method } = req.body;
    const qrFileUrl = req.file ? req.file.path : null;

    let newEntry;

    switch (method) {
      case "bank":
        const { customerName, bankName, accountNumber, ifsc } = req.body;
        newEntry = new PaymentMethod({
          method,
          bankData: { customerName, bankName, accountNumber, ifsc },
        });
        break;

      case "qr":
        const { upiId } = req.body;
        if (!qrFileUrl) return res.status(400).json({ message: "QR file missing!" });
        newEntry = new PaymentMethod({ method, qrData: { upiId, qrFile: qrFileUrl } });
        break;

      case "usdt":
        const { network } = req.body;
        if (!qrFileUrl) return res.status(400).json({ message: "USDT QR file missing!" });
        newEntry = new PaymentMethod({ method, usdtData: { network, qrFile: qrFileUrl } });
        break;

      default:
        return res.status(400).json({ message: "Invalid payment method" });
    }

    await newEntry.save();

    console.log("✅ Uploaded to Cloudinary:", qrFileUrl);
    return res.json({ message: "Payment method added successfully", data: newEntry });
  } catch (err) {
    console.error("❌ Error adding payment method:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------------------- GET all payment methods ----------------------
router.get("/all", async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find();
    res.json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- GET payment method by ID ----------------------
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

// ---------------------- PUT update payment method ----------------------
router.put("/update/:id", upload.single("qrFile"), async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body;

    const existing = await PaymentMethod.findById(id);
    if (!existing) return res.status(404).json({ message: "Payment method not found" });

    const updateData = { method };

    if (method === "bank") {
      const { customerName, bankName, accountNumber, ifsc } = req.body;
      updateData.bankData = { customerName, bankName, accountNumber, ifsc };
      updateData.qrData = undefined;
      updateData.usdtData = undefined;
    } else if (method === "qr") {
      const { upiId } = req.body;
      updateData.qrData = {
        upiId,
        qrFile: req.file ? req.file.path : existing.qrData?.qrFile || null,
      };
      updateData.bankData = undefined;
      updateData.usdtData = undefined;
    } else if (method === "usdt") {
      const { network } = req.body;
      updateData.usdtData = {
        network,
        qrFile: req.file ? req.file.path : existing.usdtData?.qrFile || null,
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

// ---------------------- DELETE payment method ----------------------
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const methodToDelete = await PaymentMethod.findById(id);
    if (!methodToDelete) return res.status(404).json({ message: "Payment method not found" });

    // ⚠️ If files were stored locally, you could delete them here.
    // Since we use Cloudinary, files are automatically stored in cloud. 
    // Optionally, you can delete from Cloudinary using cloudinary.uploader.destroy(public_id)

    await PaymentMethod.findByIdAndDelete(id);
    res.json({ message: "Payment method deleted" });
  } catch (error) {
    console.error("Delete payment method error:", error);
    res.status(500).json({ message: "Server error deleting payment method" });
  }
});

module.exports = router;
