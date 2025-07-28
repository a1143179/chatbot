// Azure Functions v4 entry point
// This file imports all functions to ensure they are registered

// Import all functions
require('./src/functions/health.js');
require('./src/functions/process.js');

console.log('Azure Functions app initialized'); 