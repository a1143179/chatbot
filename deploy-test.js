const fs = require('fs');
const path = require('path');

console.log('🔍 Testing deployment package structure...');

// Create deployment directory
const deploymentDir = './deployment-test';
if (fs.existsSync(deploymentDir)) {
    fs.rmSync(deploymentDir, { recursive: true });
}
fs.mkdirSync(deploymentDir);

// Copy files from api directory
const apiDir = './api';
const files = fs.readdirSync(apiDir);

files.forEach(file => {
    const sourcePath = path.join(apiDir, file);
    const destPath = path.join(deploymentDir, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
        // Copy directory
        fs.cpSync(sourcePath, destPath, { recursive: true });
    } else {
        // Copy file
        fs.copyFileSync(sourcePath, destPath);
    }
});

// Verify host.json is at root
const hostJsonPath = path.join(deploymentDir, 'host.json');
if (fs.existsSync(hostJsonPath)) {
    console.log('✅ host.json found at root level');
} else {
    console.log('❌ host.json not found at root level');
}

// Verify package.json is at root
const packageJsonPath = path.join(deploymentDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    console.log('✅ package.json found at root level');
} else {
    console.log('❌ package.json not found at root level');
}

// Verify index.js is at root
const indexJsPath = path.join(deploymentDir, 'index.js');
if (fs.existsSync(indexJsPath)) {
    console.log('✅ index.js found at root level');
} else {
    console.log('❌ index.js not found at root level');
}

// Verify src directory exists
const srcPath = path.join(deploymentDir, 'src');
if (fs.existsSync(srcPath)) {
    console.log('✅ src directory found');
} else {
    console.log('❌ src directory not found');
}

console.log('\n📁 Deployment package structure:');
const deploymentFiles = fs.readdirSync(deploymentDir);
deploymentFiles.forEach(file => {
    const stats = fs.statSync(path.join(deploymentDir, file));
    const type = stats.isDirectory() ? '📁' : '📄';
    console.log(`  ${type} ${file}`);
});

console.log('\n🎯 Deployment package structure test completed!'); 