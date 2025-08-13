const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const Investplan = require('./models/Investplan');  // adjust path as needed
const paymentMethodRoutes = require("./routes/paymentRoutes"); // your new routes file
const path = require("path");

const startDailyIncomeCron = require("./cron/dailyIncome"); 

dotenv.config();
const app = express();
app.get('/', (req, res) => {
  res.send('API is running!');
});



app.use(cors());
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:5174', 'https://your-frontend.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use("/uploads/qr_codes", express.static(path.join(__dirname, "uploads/qr_codes")));

const { router: forgotPasswordRoute } = require('./routes/forgotPassword');
const resetPasswordRoute = require('./routes/resetPassword');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    startDailyIncomeCron(); // Start cron AFTER DB connect
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));


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


app.use("/api/payment-methods", paymentMethodRoutes);




app.use('/api', forgotPasswordRoute);
app.use('/api', resetPasswordRoute);



//admin all route
const adminAuthRoutes = require('./routes/adminAuth');
app.use('/api/admin', adminAuthRoutes);

const adminStatsRoutes = require('./routes/adminStats');  // adjust path
app.use('/api/admin-stats', adminStatsRoutes);

const subPlanRouter = require('./routes/subPlan');

// Mount the router at /api/sub-plan
app.use('/api/sub-plan', subPlanRouter);


const changePasswordRoutes = require("./routes/changepassword"); // adjust path if needed
app.use("/api/", changePasswordRoutes);




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});