const express = require("express");
const Logo = require("../models/Logo");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../uploads/logos");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Get all logos
router.get("/", async (req, res) => {
  try {
    const logos = await Logo.find().sort({ createdAt: -1 });
    res.json(logos);
  } catch (err) {
    console.error("Error fetching logos:", err);
    res.status(500).json({ error: "Failed to fetch logos" });
  }
});

// Add new logo
router.post("/add", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "File is required" });

    const newLogo = new Logo({ url: req.file.filename });
    await newLogo.save();

    res.json({ message: "Logo added successfully", data: newLogo });
  } catch (err) {
    console.error("Error adding logo:", err);
    res.status(500).json({ error: "Failed to add logo" });
  }
});

// Update logo
router.put("/update/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: "File is required" });

    // Delete old file
    const existingLogo = await Logo.findById(id);
    if (existingLogo) {
      const oldPath = path.join(__dirname, "../uploads/logos", existingLogo.url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updatedLogo = await Logo.findByIdAndUpdate(
      id,
      { url: req.file.filename },
      { new: true }
    );

    if (!updatedLogo) return res.status(404).json({ error: "Logo not found" });

    res.json({ message: "Logo updated successfully", data: updatedLogo });
  } catch (err) {
    console.error("Error updating logo:", err);
    res.status(500).json({ error: "Failed to update logo" });
  }
});

// Delete logo
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLogo = await Logo.findByIdAndDelete(id);
    if (!deletedLogo) return res.status(404).json({ error: "Logo not found" });

    // Delete file from uploads
    const filePath = path.join(__dirname, "../uploads/logos", deletedLogo.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: "Logo deleted successfully" });
  } catch (err) {
    console.error("Error deleting logo:", err);
    res.status(500).json({ error: "Failed to delete logo" });
  }
});

module.exports = router;
