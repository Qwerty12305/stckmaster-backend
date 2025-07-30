const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
  },
  planId: {
    type: String,  // or Number if you prefer
    required: true,
    unique: true,
  },
});



module.exports = mongoose.model('Plan', planSchema);
