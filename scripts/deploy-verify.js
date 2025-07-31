// scripts/deploy-verify.js
const path = require('path');
const fs = require('fs');

try {
  console.log('=== Starting deployment verification ===');
  
  // 1. Define and check path
  const modelPath = path.join(__dirname, '..', 'models', 'InvestPlan.js');
  console.log('Model path:', modelPath);
  console.log('File exists?', fs.existsSync(modelPath));
  
  // 2. Verify require
  console.log('Attempting to require...');
  const InvestPlan = require(modelPath);
  console.log('✅ InvestPlan successfully required');
  
  // 3. Verify schema
  console.log('Schema keys:', Object.keys(InvestPlan.schema.paths));
  
  console.log('=== Verification successful ===');
  process.exit(0);
} catch (err) {
  console.error('❌ Verification failed:', err);
  process.exit(1);
}
