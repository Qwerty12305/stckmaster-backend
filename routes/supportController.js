// routes/supportRoutes.js
const express = require("express");
const router = express.Router();
const SupportContact = require("../models/SupportContact");

// Get all support contacts
router.get("/", async (req, res) => {
  try {
    const contacts = await SupportContact.find({});
    res.status(200).json(contacts); // always return an array, even if empty
  } catch (err) {
    console.error("Error fetching support contacts:", err);
    res.status(500).json({ error: "Server error fetching support contacts" });
  }
});

// Add new contact
router.post("/supportAdd", async (req, res) => {
  try {
    const { name, url, number } = req.body;
    const newContact = await SupportContact.create({ name, url, number });
    res.status(201).json(newContact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add contact" });
  }
});

// Update contact
router.put("/supportUpdate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, number } = req.body;
    const updated = await SupportContact.findByIdAndUpdate(
      id,
      { name, url, number },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// Delete contact
router.delete("/supportDelete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await SupportContact.findByIdAndDelete(id);
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

module.exports = router;
