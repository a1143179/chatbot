#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Azure Functions Tests...\n');

try {
  // Install dependencies if needed
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Run tests
  console.log('\n🔍 Running tests...');
  execSync('npm test', { stdio: 'inherit' });

  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
} 