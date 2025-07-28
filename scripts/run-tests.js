#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running all tests before commit...\n');

let allTestsPassed = true;

try {
  // Run frontend tests
  console.log('📝 Running frontend tests...');
  execSync('npm run test', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Frontend tests passed!\n');
} catch (error) {
  console.error('❌ Frontend tests failed!');
  allTestsPassed = false;
}

try {
  // Run API tests
  console.log('🔧 Running API tests...');
  execSync('npm test', { stdio: 'inherit', cwd: path.join(process.cwd(), 'api') });
  console.log('✅ API tests passed!\n');
} catch (error) {
  console.error('❌ API tests failed!');
  allTestsPassed = false;
}

// Summary
console.log('📊 Test Summary:');
console.log(`  Frontend Tests: ${allTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`  API Tests: ${allTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);

if (!allTestsPassed) {
  console.log('\n❌ Some tests failed. Please fix the issues before committing.');
  process.exit(1);
}

console.log('\n✅ All tests passed! Ready to commit.'); 