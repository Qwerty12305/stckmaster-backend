const tempOtpStore = {};

module.exports = {
  setOtp: (mobile, otp) => {
    tempOtpStore[mobile] = { otp, createdAt: Date.now() };
  },
  getOtp: (mobile) => tempOtpStore[mobile],
  deleteOtp: (mobile) => delete tempOtpStore[mobile],
};
