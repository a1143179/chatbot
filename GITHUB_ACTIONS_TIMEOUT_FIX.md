# GitHub Actions Timeout Fix

## Issue Description

The GitHub Actions workflow was experiencing timeout errors when downloading the Azure login action:

```
Warning: Failed to download action 'https://api.github.com/repos/Azure/login/tarball/a457da9ea143d694b1b9c7c869ebb04ebe844ef5'. 
Error: The request was canceled due to the configured HttpClient.Timeout of 100 seconds elapsing.
Warning: Back off 20.247 seconds before retry.
```

## Root Causes

1. **Network Connectivity Issues**: GitHub's servers or network connectivity problems
2. **Action Download Timeouts**: Large action files taking too long to download
3. **No Timeout Configuration**: Missing explicit timeout settings
4. **No Retry Mechanisms**: No automatic retry on failures

## Solutions Implemented

### 1. **Added Explicit Timeouts**

**Job-level timeout:**
```yaml
jobs:
  deploy:
    timeout-minutes: 30
```

**Step-level timeouts:**
```yaml
- name: Login to Azure
  uses: azure/login@v2
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}
  timeout-minutes: 10

- name: Install dependencies
  run: |
    cd api
    npm ci --no-audit
  timeout-minutes: 10

- name: Deploy to Azure Functions
  run: |
    cd deployment
    func azure functionapp publish chatbotprocessor --javascript --force
  timeout-minutes: 20
```

### 2. **Optimized Dependencies Installation**

**Before:**
```yaml
- name: Install dependencies
  run: |
    cd api
    npm ci
```

**After:**
```yaml
- name: Install dependencies
  run: |
    cd api
    npm ci --no-audit
  timeout-minutes: 10
```

### 3. **Enhanced Checkout Configuration**

**Before:**
```yaml
- uses: actions/checkout@v4
```

**After:**
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

### 4. **Improved Deployment Commands**

**Before:**
```yaml
- name: Deploy to Azure Functions
  run: |
    cd deployment
    func azure functionapp publish chatbotprocessor --javascript
```

**After:**
```yaml
- name: Deploy to Azure Functions
  run: |
    cd deployment
    func azure functionapp publish chatbotprocessor --javascript --force
  timeout-minutes: 20
```

## Files Updated

### 1. **`.github/workflows/deploy-functions-merged.yml`**
- ✅ Added job-level timeout (30 minutes)
- ✅ Added step-level timeouts for all critical steps
- ✅ Optimized npm install with `--no-audit`
- ✅ Enhanced checkout with `fetch-depth: 0`
- ✅ Added `--force` flag to deployment command

### 2. **`.github/workflows/deploy-functions.yml`**
- ✅ Added job-level timeout (15 minutes)
- ✅ Added step-level timeouts
- ✅ Optimized npm install
- ✅ Enhanced checkout configuration

## Timeout Guidelines

### Recommended Timeouts

| Step | Timeout | Reason |
|------|---------|--------|
| **Job Total** | 30 minutes | Complete workflow execution |
| **Dependencies** | 10 minutes | npm install can be slow |
| **Azure Login** | 10 minutes | Network-dependent action |
| **Deployment** | 20 minutes | Large file uploads |
| **Tests** | 5 minutes | Should be fast |
| **Setup** | 5 minutes | Quick configuration |

### Best Practices

1. **Set Realistic Timeouts**
   - Don't set timeouts too low (causes unnecessary failures)
   - Don't set timeouts too high (wastes resources)

2. **Monitor and Adjust**
   - Track actual execution times
   - Adjust timeouts based on real performance

3. **Use Caching**
   - Enable npm cache for faster installs
   - Use `fetch-depth: 0` for better Git operations

4. **Optimize Commands**
   - Use `--no-audit` for faster npm installs
   - Use `--force` for deployments when needed

## Troubleshooting

### If Timeouts Still Occur

1. **Check Network Status**
   ```bash
   # GitHub Actions status
   https://www.githubstatus.com/
   ```

2. **Increase Timeouts**
   ```yaml
   timeout-minutes: 15  # Increase from 10 to 15
   ```

3. **Use Alternative Actions**
   ```yaml
   # Try different Azure login action version
   uses: azure/login@v1
   ```

4. **Split Large Jobs**
   ```yaml
   # Break into smaller jobs
   jobs:
     test:
       # Quick tests
     deploy:
       # Separate deployment
   ```

### Monitoring

Track these metrics:
- **Success Rate**: Should be >95%
- **Average Execution Time**: Should be <20 minutes
- **Timeout Frequency**: Should be <5%

## Prevention

### Regular Maintenance

1. **Update Actions Monthly**
   ```yaml
   # Keep actions updated
   uses: actions/checkout@v4  # Latest version
   uses: azure/login@v2      # Latest version
   ```

2. **Monitor Dependencies**
   ```bash
   # Regular npm audit
   npm audit
   ```

3. **Review Timeouts Quarterly**
   - Analyze execution times
   - Adjust timeouts as needed

### Proactive Measures

1. **Use Caching**
   ```yaml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'
   ```

2. **Optimize Commands**
   ```yaml
   - run: npm ci --no-audit --prefer-offline
   ```

3. **Parallel Execution**
   ```yaml
   # Run independent steps in parallel
   strategy:
     matrix:
       os: [ubuntu-latest, windows-latest]
   ```

This timeout fix ensures more reliable GitHub Actions execution and reduces deployment failures due to network issues. 