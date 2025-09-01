const express = require('express');
const axios = require('axios');
const router = express.Router();

const AUTH_TOKEN = process.env.MESSAGECENTRAL_AUTH_TOKEN;
const CUSTOMER_ID = process.env.MESSAGECENTRAL_CUSTOMER_ID;

// Send OTP
router.post('/send-otp', async (req, res) => {
  const { mobileNumber, countryCode } = req.body;

  try {
    const response = await axios.post(
      `https://cpaas.messagecentral.com/verification/v3/send?countryCode=${countryCode}&customerId=${CUSTOMER_ID}&flowType=SMS&mobileNumber=${mobileNumber}`,
      {},
      { headers: { authToken: AUTH_TOKEN } }
    );

    // Handle REQUEST_ALREADY_EXISTS
    if (response.data.responseCode === '506') {
      return res.json({
        verificationId: response.data.data.verificationId,
        mobileNumber: response.data.data.mobileNumber,
        message: 'OTP already sent. Use this OTP or wait for timeout.',
        timeout: response.data.data.timeout
      });
    }

    res.json({
      verificationId: response.data.data.verificationId,
      mobileNumber: response.data.data.mobileNumber,
      message: 'OTP Sent ✅'
    });

  } catch (error) {
    console.error('Send OTP error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { mobileNumber, countryCode, verificationId, code } = req.body;

  try {
    const response = await axios.get(
      `https://cpaas.messagecentral.com/verification/v3/validateOtp?countryCode=${countryCode}&mobileNumber=${mobileNumber}&verificationId=${verificationId}&customerId=${CUSTOMER_ID}&code=${code}`,
      { headers: { authToken: AUTH_TOKEN } }
    );

    res.json(response.data);
  } catch (err) {
    console.error('Verify OTP error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router;
