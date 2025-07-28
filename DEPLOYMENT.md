# Deployment Guide

This guide explains how to deploy the chatbot application using GitHub Pages for frontend and Azure Functions for backend.

## Architecture

- **Frontend**: React app deployed to GitHub Pages
- **Backend**: Azure Functions with Google AI Studio integration
- **Repository**: Single repository with both frontend and backend code

## Prerequisites

1. **GitHub Account** with repository access
2. **Azure Account** with subscription
3. **Google AI Studio API Key** for Gemini Pro

## Step 1: Azure Functions Setup

### 1.1 Create Azure Function App

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Function App"
4. Click "Create"
5. Fill in the details:
   - **Subscription**: Your subscription
   - **Resource Group**: Create new or use existing
   - **Function App name**: `your-chatbot-functions`
   - **Publish**: Code
   - **Runtime stack**: Node.js
   - **Version**: 18 LTS
   - **Region**: Choose closest to you
   - **Operating System**: Windows (recommended)
   - **Plan type**: Consumption (Serverless)
   - **Storage Account**: Create new (Azure will create this automatically)
6. Click "Review + create" then "Create"

**Important**: Azure will automatically create a storage account for your Function App. This is required for Azure Functions to work properly.

### 1.2 Configure Environment Variables

1. Go to your Function App in Azure Portal
2. Navigate to "Configuration" → "Application settings"
3. Add new application setting:
   - **Name**: `GOOGLE_AI_API_KEY`
   - **Value**: Your Google AI Studio API key
4. Click "Save"

### 1.3 Get Function App URL

1. In Azure Portal, go to your Function App
2. Copy the URL (e.g., `https://your-chatbot-functions.azurewebsites.net`)

## Step 2: GitHub Repository Setup

### 2.1 Create Azure Service Principal

Before configuring GitHub secrets, you need to create an Azure Service Principal:

1. **Install Azure CLI** (if not already installed):
```bash
# Windows
winget install -e --id Microsoft.AzureCLI

# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

2. **Login to Azure**:
```bash
az login
```

3. **Create Service Principal**:
```bash
# Replace 'your-subscription-id' with your actual subscription ID
az ad sp create-for-rbac --name "chatbot-deployment" --role contributor \
  --scopes /subscriptions/your-subscription-id \
  --sdk-auth
```

4. **Save the output** - This JSON output contains your credentials:
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret", 
  "subscriptionId": "your-subscription-id",
  "tenantId": "your-tenant-id",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### 2.2 Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

```
AZURE_CREDENTIALS: [Paste the entire JSON output from step 3]
AZURE_FUNCTION_APP_NAME: your-chatbot-functions
```

**Important**: 
- The `AZURE_CREDENTIALS` should be the complete JSON string from the service principal creation
- Make sure your Azure Function App is properly created in Azure Portal with storage account before deploying
- The service principal needs Contributor role on your subscription or resource group

### 2.3 Update Configuration

1. Update `src/config.ts`:
```typescript
const config: Config = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://your-chatbot-functions.azurewebsites.net/api/processor',
  environment: (process.env.NODE_ENV as 'development' | 'production') || 'development'
};
```

2. Replace `your-chatbot-functions` with your actual Function App name.

## Step 3: Enable GitHub Pages

1. Go to your GitHub repository
2. Navigate to "Settings" → "Pages"
3. Under "Source", select "Deploy from a branch"
4. Select "gh-pages" branch
5. Click "Save"

## Step 4: Deploy

### 4.1 Push Code

```bash
git add .
git commit -m "Setup deployment configuration"
git push
```

### 4.2 Monitor Deployment

1. **Frontend**: Check "Actions" tab in GitHub for frontend deployment
2. **Backend**: Check "Actions" tab for backend deployment
3. **Azure**: Check Function App in Azure Portal

## Step 5: Test

1. **Frontend URL**: `https://your-username.github.io/chatbot`
2. **Backend URL**: `https://your-chatbot-functions.azurewebsites.net/api/processor`
3. **Health Check**: `https://your-chatbot-functions.azurewebsites.net/api/health`

### Health Check Response Example

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "chatbot-api",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "googleAI": {
      "configured": true,
      "status": "ready"
    },
    "azureFunctions": {
      "status": "running",
      "runtime": "node"
    }
  }
}
```

## Troubleshooting

### Frontend Issues

1. **Build fails**: Check GitHub Actions logs
2. **API calls fail**: Verify Azure Function URL in config
3. **CORS errors**: Add CORS headers in Azure Function

### Backend Issues

1. **Function not found**: Check deployment logs
2. **API key error**: Verify environment variable in Azure
3. **Cold start**: First request may be slow
4. **Deployment validation failed**: 
   - Ensure Function App is created with Node.js runtime
   - Make sure storage account is created (Azure does this automatically)
   - Check that all required environment variables are set

### CORS Configuration

Add this to your Azure Function response headers:

```javascript
context.res = {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  },
  body: { /* your response */ }
};
```

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=https://your-chatbot-functions.azurewebsites.net/api/processor
```

### Backend (Azure Function App Settings)
```
GOOGLE_AI_API_KEY=your-google-ai-api-key
FUNCTIONS_WORKER_RUNTIME=node
AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=your-storage-account;AccountKey=your-key;EndpointSuffix=core.windows.net
```

**Note**: The `AzureWebJobsStorage` connection string is automatically configured by Azure when you create the Function App.

## Cost Optimization

1. **Azure Functions**: Use Consumption plan (pay per use)
2. **Azure Storage**: Minimal cost for Function App storage
3. **GitHub Pages**: Free for public repositories
4. **Google AI**: Check pricing for API calls

## Security Notes

1. **API Keys**: Never commit API keys to repository
2. **CORS**: Configure properly for production
3. **HTTPS**: Both GitHub Pages and Azure Functions use HTTPS by default

## Local Development

### Azure Functions Local Development

1. Install Azure Functions Core Tools:
```bash
npm install -g azure-functions-core-tools@4
```

2. Create local settings file (for local development only):
```bash
# Create local.settings.json in api/ directory
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "GOOGLE_AI_API_KEY": "your-google-ai-api-key-here"
  }
}
```

**Important**: The `local.settings.json` file is for local development only and should not be committed to the repository.

3. Install Azure Storage Emulator (for Windows) or Azurite:
```bash
# For Windows
# Download and install Azure Storage Emulator

# For cross-platform (Azurite)
npm install -g azurite
```

4. Start local development:
```bash
cd api
func start
```

5. Test locally:
```bash
curl -X POST http://localhost:7071/api/processor \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}'
```

### Running Tests

1. Install test dependencies:
```bash
cd api
npm install
```

2. Run all tests:
```bash
npm test
```

3. Run tests with coverage:
```bash
npm run test:coverage
```

4. Run tests in watch mode:
```bash
npm run test:watch
```

### Test Coverage

The tests cover:
- **Processor Function** (`/api/processor`):
  - Successful API calls
  - Error handling (missing API key, invalid requests)
  - CORS headers
  - Google AI API integration

- **Health Function** (`/api/health`):
  - Service status checks
  - Environment variable validation
  - Response structure validation
  - CORS headers 