require('dotenv').config();  // must be at the very top

console.log("Account SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Auth Token:", process.env.TWILIO_AUTH_TOKEN ? "Loaded" : "Missing");
console.log("Verify Service SID:", process.env.TWILIO_VERIFY_SERVICE_SID);


const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const Investplan = require('./models/Investplan');  // adjust path as needed
require("./cron/dailyIncome");
dotenv.config();
const app = express();

console.log("Account SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Auth Token:", process.env.TWILIO_AUTH_TOKEN);
console.log("Verify Service SID:", process.env.TWILIO_VERIFY_SERVICE_SID);

app.use(cors());
app.use(express.json());
const { router: forgotPasswordRoute } = require('./routes/forgotPassword');
const resetPasswordRoute = require('./routes/resetPassword');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));



  app.post('/api/test-body', (req, res) => {
  console.log('Request body:', req.body);
  res.json({ receivedBody: req.body });
});

const authRoutes = require("./routes/auth");
app.use("/api/user", authRoutes);




const signinRoute = require('./routes/signin');
app.use('/api', signinRoute);

const depositRoute = require("./routes/deposit");
app.use("/api/deposit", depositRoute);
app.use('/api', require('./routes/deposit'));

const withdrawRoutes = require("./routes/withdraw");
app.use("/api/withdraw", withdrawRoutes);


const bankRoutes = require("./routes/bankRoutes");
app.use("/api/banks", bankRoutes); // <-- This line must exist

const referralRoutes = require("./routes/referral");
app.use("/api/referral", referralRoutes);

const planRoutes = require('./routes/plan');
app.use('/api/plan', planRoutes);


const xyz = require('./routes/planDetail');  // singular 'planDetail'
app.use('/api/plan-detail', xyz);



const investPlanRoutes = require("./routes/investplan"); // or payment.js
app.use("/api/payment", investPlanRoutes); // this line registers the route

const investRoutes = require("./routes/investplan");
app.use("/api/invest", investRoutes); // Now you can call /api/invest/total/:userId





app.use('/api', forgotPasswordRoute);
app.use('/api', resetPasswordRoute);






const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
