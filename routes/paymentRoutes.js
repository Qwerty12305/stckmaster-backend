const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const PaymentMethod = require("../models/PaymentMethod");

// ❌ remove cloudinary.config() — not needed when using CLOUDINARY_URL

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "qr_codes",
    format: async (_req, file) => file.mimetype.split("/")[1], // keep original format (png/jpg/webp…)
    public_id: (_req, _file) => Date.now().toString(), // unique name
  },
});

const upload = multer({ storage });

// POST add payment method
router.post("/add", upload.single("qrFile"), async (req, res) => {
  try {
    const { method } = req.body;
    const qrFileUrl = req.file ? req.file.path : null; // Cloudinary URL auto-populated

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
        newEntry = new PaymentMethod({
          method,
          qrData: { upiId, qrFile: qrFileUrl },
        });
        break;

      case "usdt":
        const { network } = req.body;
        newEntry = new PaymentMethod({
          method,
          usdtData: { network, qrFile: qrFileUrl },
        });
        break;

      default:
        return res.status(400).json({ message: "Invalid payment method" });
    }

    await newEntry.save();

    console.log("✅ Uploaded to Cloudinary:", qrFileUrl); // <-- log the Cloudinary URL in console

    return res.json({
      message: "Payment method added successfully",
      data: newEntry,
    });
  } catch (err) {
    console.error("❌ Error adding payment method:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});





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
