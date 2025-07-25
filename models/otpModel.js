const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  timestamp: Date
});

const OtpModel = mongoose.model('Otp', otpSchema);
module.exports = OtpModel;
