# Node.js 20 Upgrade Guide

## Overview

This project has been upgraded to use Node.js 20 across all components for better performance, security, and modern JavaScript features.

## Changes Made

### ✅ Package.json Updates

**Frontend (root package.json):**
- Updated `@types/node` from `^16.18.126` to `^20.0.0`

**API (api/package.json):**
- Updated `engines.node` from `18.x` to `20.x`

### ✅ GitHub Actions Workflows

All CI/CD workflows updated to use Node.js 20:
- `deploy-functions.yml` - Node.js 20
- `deploy-functions-merged.yml` - Node.js 20
- `deploy-frontend.yml` - Node.js 20
- `deploy-frontend-merged.yml` - Node.js 20

### ✅ Local Development

Added `.nvmrc` files:
- Root `.nvmrc` - Node.js 20
- `api/.nvmrc` - Node.js 20

## Benefits of Node.js 20

### Performance Improvements
- **Faster startup times** - Improved V8 engine performance
- **Better memory management** - Reduced memory usage
- **Enhanced garbage collection** - More efficient memory cleanup

### Security Enhancements
- **Latest security patches** - Up-to-date security fixes
- **Improved crypto modules** - Better encryption performance
- **Enhanced TLS support** - Better SSL/TLS handling

### Modern JavaScript Features
- **ES2022 support** - Latest ECMAScript features
- **Better TypeScript support** - Improved type checking
- **Enhanced debugging** - Better debugging capabilities

## Local Development Setup

### Using nvm (Node Version Manager)

```bash
# Install Node.js 20
nvm install 20
nvm use 20

# Verify version
node --version  # Should show v20.x.x
```

### Using .nvmrc files

The project includes `.nvmrc` files that automatically set the correct Node.js version:

```bash
# Navigate to project root
cd /path/to/chatbot
nvm use  # Automatically uses Node.js 20

# Navigate to API directory
cd api
nvm use  # Automatically uses Node.js 20
```

## Azure Functions Compatibility

### Azure Functions Runtime Support
- **Azure Functions v4** fully supports Node.js 20
- **Better cold start performance** with Node.js 20
- **Enhanced debugging** capabilities

### Deployment Considerations
- Azure Functions will automatically use Node.js 20 based on `engines.node` in `api/package.json`
- No additional configuration needed for Azure deployment

## Testing the Upgrade

### Local Testing
```bash
# Test frontend
npm run test

# Test API
cd api && npm test

# Test full suite
npm run full-pre-commit
```

### CI/CD Testing
- All GitHub Actions workflows now use Node.js 20
- Automated testing will verify compatibility
- Deployment will use Node.js 20 runtime

## Rollback Plan

If issues arise, you can rollback to Node.js 18:

1. **Update package.json files:**
   ```json
   // api/package.json
   "engines": { "node": "18.x" }
   
   // package.json
   "@types/node": "^16.18.126"
   ```

2. **Update GitHub Actions:**
   ```yaml
   node-version: '18'
   ```

3. **Update .nvmrc files:**
   ```
   # .nvmrc and api/.nvmrc
   18
   ```

## Verification Checklist

- [ ] Local development works with Node.js 20
- [ ] All tests pass with Node.js 20
- [ ] GitHub Actions use Node.js 20
- [ ] Azure Functions deployment uses Node.js 20
- [ ] No breaking changes in application functionality
- [ ] Performance improvements observed

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

2. **TypeScript errors**
   - Update TypeScript configuration if needed
   - Check for deprecated APIs

3. **Azure Functions deployment issues**
   - Verify Azure Functions runtime version supports Node.js 20
   - Check function app configuration

### Performance Monitoring

Monitor these metrics after upgrade:
- **Cold start times** - Should improve
- **Memory usage** - Should be more efficient
- **CPU usage** - Should be optimized
- **Deployment times** - Should be faster

## Next Steps

1. **Monitor performance** - Track improvements in production
2. **Update dependencies** - Consider updating other packages for Node.js 20 compatibility
3. **Security audit** - Run security scans with new Node.js version
4. **Documentation** - Update team documentation with Node.js 20 requirements

The upgrade to Node.js 20 provides significant performance and security benefits while maintaining full compatibility with your existing codebase! 