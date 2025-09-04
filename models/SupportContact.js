// models/SupportContact.js
const mongoose = require("mongoose");

const supportContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    number: { type: String, required: true },
  },
  { timestamps: true }
);

const SupportContact = mongoose.models.SupportContact || mongoose.model("SupportContact", supportContactSchema);

module.exports = SupportContact;
