// utils/sendOtpTwilio.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

const sendOtpViaTwilio = async (mobile, otp) => {
  const message = `Your OTP is ${otp}`;
  const to = `+91${mobile}`; // or change country code accordingly

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
};

module.exports = { sendOtpViaTwilio };
