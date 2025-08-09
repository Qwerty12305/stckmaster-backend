const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin'); // adjust path if needed
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect('mongodb+srv://jodhasingh345646:YW4dclivN30eRxRV@cluster0.n1arax0.mongodb.net/stockmarketDB?retryWrites=true&w=majority&appName=Cluster0');

    const name = 'Bull Admin';
    const mobile = '9827619810';  // must provide mobile
    const password = 'bullAdmin@123#';

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      name,
      mobile,
      password: hashedPassword,
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Admin creation failed:', error);
  }
}

createAdmin();
