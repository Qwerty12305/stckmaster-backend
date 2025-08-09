// models/Plan.js
const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true, // Ensure uniqueness
  },
  planName: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Plan", planSchema);
