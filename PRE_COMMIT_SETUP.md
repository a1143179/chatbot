# Pre-commit Hook Setup Guide

## Overview

This project now includes a comprehensive pre-commit hook that ensures code quality and prevents broken builds from being committed. The hook runs before every commit and only allows the commit if all checks pass.

## What the Pre-commit Hook Does

### 1. **Frontend Validation** (`.husky/pre-commit`)
- ✅ **Linting** - ESLint checks for code style and potential errors
- ✅ **Type Checking** - TypeScript compilation check
- ✅ **Unit Tests** - Jest test suite execution
- ⚡ **Fast Validation** - No build step for speed

### 2. **API Validation**
- ✅ **API Linting** - ESLint for API code
- ✅ **API Tests** - Jest tests for Azure Functions

### 3. **Automatic Code Formatting**
- ✅ **ESLint Auto-fix** - Automatically fixes formatting issues
- ✅ **Git Add** - Stages the fixed files

## How It Works

### Pre-commit Hook Flow

```bash
# When you run: git commit -m "your message"

1. 🔍 Pre-commit hook triggers
2. 📝 Frontend validation:
   - ESLint (linting)
   - TypeScript (type checking)
   - Jest (unit tests)
   - React build (production build)
3. 🔧 API validation:
   - API ESLint
   - API Jest tests
4. ✅ If all pass → Commit allowed
5. ❌ If any fail → Commit blocked
```

### Fast Validation Script

The `build-check` script runs these commands in sequence (no build for speed):
```bash
npm run lint && npm run type-check && npm run test
```

### Full Build Check (Optional)

For deployment preparation, use the `full-build-check` script:
```bash
npm run lint && npm run type-check && npm run test && npm run build
```

## Configuration Files

### 1. **Package.json Scripts**
```json
{
  "scripts": {
    "build-check": "npm run lint && npm run type-check && npm run test",
    "full-build-check": "npm run lint && npm run type-check && npm run test && npm run build"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "git add"],
    "*.{js,jsx}": ["eslint --fix", "git add"]
  }
}
```

### 2. **Husky Configuration**
```json
{
  "prepare": "husky"
}
```

### 3. **Pre-commit Hook** (`.husky/pre-commit`)
- Runs fast frontend validation (lint, type-check, test - no build)
- Runs API validation (lint, test)
- Blocks commit if any step fails
- ⚡ **Fast execution** - typically <15 seconds

## Benefits

### ✅ **Prevents Broken Code**
- No commits with failing tests
- No commits with TypeScript errors
- No commits with linting errors
- No commits with syntax errors

### ✅ **Ensures Code Quality**
- Consistent code formatting
- Type safety enforcement
- Test coverage maintenance
- Build integrity verification

### ✅ **Developer Experience**
- Immediate feedback on code issues
- Automatic code formatting
- Clear error messages
- ⚡ **Fast validation** (typically <15 seconds)

## Usage

### Normal Development Flow

```bash
# Make your changes
git add .
git commit -m "Add new feature"

# Pre-commit hook automatically runs:
# 1. Lints your code
# 2. Runs type checking
# 3. Executes tests
# 4. If all pass → commit succeeds
# 5. If any fail → commit blocked with error details
```

### When Tests Fail

If the pre-commit hook fails, you'll see output like:
```
🔍 Running pre-commit checks...
📝 Running frontend validation...

❌ Frontend validation failed. Commit blocked.
```

**Fix the issues and try again:**
```bash
# Fix the issues shown in the error output
# Then commit again
git commit -m "Add new feature"
```

### Bypassing Pre-commit (Emergency Only)

**⚠️ Only use in emergencies:**
```bash
git commit -m "Emergency fix" --no-verify
```

## Troubleshooting

### Common Issues

1. **Husky not installed**
   ```bash
   npm install --save-dev husky
   npm run prepare
   ```

2. **Pre-commit hook not executable**
   ```bash
   chmod +x .husky/pre-commit
   ```

3. **Tests failing locally but passing in CI**
   - Ensure you're using Node.js 20: `node --version`
   - Clear cache: `npm run test -- --clearCache`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

4. **Build taking too long**
   - Pre-commit hook now skips build for speed
   - Use `npm run full-build-check` for deployment preparation
   - Build time is typically 10-30 seconds

### Performance Optimization

1. **Fast pre-commit validation**
   - Skips build step for speed
   - Only runs lint, type-check, and tests
   - Typically completes in <15 seconds

2. **Use lint-staged for faster checks**
   - Only lint changed files
   - Automatic formatting on save

3. **Parallel execution**
   - Frontend and API tests run sequentially
   - Consider parallel execution for large projects

4. **Caching**
   - Jest cache is enabled by default
   - TypeScript incremental compilation

## Customization

### Adding More Checks

Edit `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Add your custom checks here
npm run custom-check
npm run build-check
```

### Modifying Lint-staged

Edit `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "git add"],
    "*.{js,jsx}": ["eslint --fix", "git add"],
    "*.{json,md}": ["prettier --write", "git add"]
  }
}
```

### Skipping Specific Checks

For temporary bypassing:
```bash
# Skip all checks
git commit -m "message" --no-verify

# Skip specific checks (modify pre-commit hook)
SKIP_BUILD=true git commit -m "message"
```

## Best Practices

1. **Run tests locally first**
   ```bash
   npm run build-check
   cd api && npm test
   ```

2. **Fix issues before committing**
   - Don't rely on pre-commit to catch everything
   - Use your IDE's linting and type checking

3. **Keep tests fast**
   - Avoid slow integration tests in pre-commit
   - Use unit tests for pre-commit
   - Run integration tests in CI

4. **Clear error messages**
   - The hook provides clear feedback
   - Fix issues before retrying

## Team Workflow

### For New Team Members

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Verify setup**
   ```bash
   npm run build-check
   cd api && npm test
   ```

3. **Test pre-commit**
   ```bash
   git add .
   git commit -m "Test pre-commit hook"
   ```

### For Existing Projects

1. **Install Husky**
   ```bash
   npm install --save-dev husky lint-staged
   ```

2. **Initialize Husky**
   ```bash
   npm run prepare
   ```

3. **Copy pre-commit hook**
   - Copy `.husky/pre-commit` to your project
   - Update package.json scripts and lint-staged config

## Monitoring and Maintenance

### Regular Tasks

1. **Update dependencies**
   ```bash
   npm update
   ```

2. **Review test performance**
   - Monitor test execution time
   - Optimize slow tests

3. **Update linting rules**
   - Keep ESLint rules current
   - Update TypeScript configuration

### Metrics to Track

- **Pre-commit success rate** - Should be >95%
- **Test execution time** - Should be <15 seconds
- **Full build time** - Should be <60 seconds (for deployment)
- **False positives** - Minimize unnecessary failures

This pre-commit setup ensures high code quality and prevents broken builds from reaching your repository! 