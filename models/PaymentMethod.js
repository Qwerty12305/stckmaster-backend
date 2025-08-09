const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["bank", "qr", "usdt"],
    required: true,
  },
  bankData: {
    customerName: String,
    bankName: String,
    accountNumber: String,
    ifsc: String,
  },
  qrData: {
    upiId: String,
    qrFile: String,
  },
  usdtData: {
    network: {
      type: String,
      enum: ["erc20", "trc20", "bep20"],
      required: function () {
        return this.method === "usdt";
      },
    },
    qrFile: String,
  },
});


module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
