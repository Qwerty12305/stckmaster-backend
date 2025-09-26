const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

// POST /api/contact
router.post("/", async (req, res) => {
  try {
    const { name, mobile, email, message } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: "Name and Mobile are required" });
    }

    const newContact = new Contact({ name, mobile, email, message });
    await newContact.save();

    return res.status(201).json({ message: "Contact request submitted successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/contact  --> Fetch all contacts
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }); // latest first
    return res.status(200).json(contacts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
