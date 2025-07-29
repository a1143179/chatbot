#!/usr/bin/env node

/**
 * Test script to verify CI setup
 * Run this locally to ensure all tests pass before pushing
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing CI Setup...\n');

const tests = [
  {
    name: 'Frontend Linting',
    command: 'npm run lint',
    cwd: '.'
  },
  {
    name: 'Frontend Type Checking',
    command: 'npm run type-check',
    cwd: '.'
  },
  {
    name: 'Frontend Tests',
    command: 'npm run test',
    cwd: '.'
  },
  {
    name: 'Frontend Build',
    command: 'npm run build',
    cwd: '.'
  },
  {
    name: 'API Linting',
    command: 'npm run lint',
    cwd: './api'
  },
  {
    name: 'API Tests',
    command: 'npm run test',
    cwd: './api'
  },
  {
    name: 'Full Test Suite',
    command: 'npm run full-pre-commit',
    cwd: '.'
  }
];

let allPassed = true;

for (const test of tests) {
  try {
    console.log(`✅ Running: ${test.name}`);
    execSync(test.command, { 
      cwd: path.resolve(test.cwd), 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    console.log(`✅ ${test.name} - PASSED\n`);
  } catch (error) {
    console.log(`❌ ${test.name} - FAILED`);
    console.log(`Command: ${test.command}`);
    console.log(`Error: ${error.message}\n`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('🎉 All tests passed! Your CI setup is working correctly.');
  console.log('You can now push your changes and create a PR.');
} else {
  console.log('❌ Some tests failed. Please fix the issues before pushing.');
  process.exit(1);
} 