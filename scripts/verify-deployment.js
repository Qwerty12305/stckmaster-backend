const assert = require('assert');
const path = require('path');

// Load production config
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

try {
  // Verify required variables
  assert(process.env.MONGO_URI, 'MONGO_URI missing - check .env.production');
  assert(process.env.TWILIO_ACCOUNT_SID, 'TWILIO_ACCOUNT_SID missing');
  
  // Verify database connection (optional)
  require('../models/InvestPlan'); // Will throw if model can't connect
  
  console.log('✅ All required environment variables are set');
  process.exit(0);
} catch (err) {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
}
