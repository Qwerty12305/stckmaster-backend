const mongoose = require("mongoose");

const logoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // only filename
  },
  { timestamps: true }
);

const Logo = mongoose.models.Logo || mongoose.model("Logo", logoSchema);

module.exports = Logo;
