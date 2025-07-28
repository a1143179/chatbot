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
6. Click "Review + create" then "Create"

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

### 2.1 Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to "Settings" → "Secrets and variables" → "Actions"
3. Add the following secrets:

```
AZURE_CREDENTIALS: Your Azure service principal credentials (JSON)
AZURE_FUNCTION_APP_NAME: your-chatbot-functions
```

### 2.2 Create Azure Service Principal

Run these commands in Azure CLI:

```bash
# Login to Azure
az login

# Create service principal
az ad sp create-for-rbac --name "github-actions" --role contributor \
    --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
    --sdk-auth

# Copy the JSON output and add it as AZURE_CREDENTIALS secret
```

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
git push origin main
```

### 4.2 Monitor Deployment

1. **Frontend**: Check "Actions" tab in GitHub for frontend deployment
2. **Backend**: Check "Actions" tab for backend deployment
3. **Azure**: Check Function App in Azure Portal

## Step 5: Test

1. **Frontend URL**: `https://your-username.github.io/chatbot`
2. **Backend URL**: `https://your-chatbot-functions.azurewebsites.net/api/processor`

## Troubleshooting

### Frontend Issues

1. **Build fails**: Check GitHub Actions logs
2. **API calls fail**: Verify Azure Function URL in config
3. **CORS errors**: Add CORS headers in Azure Function

### Backend Issues

1. **Function not found**: Check deployment logs
2. **API key error**: Verify environment variable in Azure
3. **Cold start**: First request may be slow

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
```

## Cost Optimization

1. **Azure Functions**: Use Consumption plan (pay per use)
2. **GitHub Pages**: Free for public repositories
3. **Google AI**: Check pricing for API calls

## Security Notes

1. **API Keys**: Never commit API keys to repository
2. **CORS**: Configure properly for production
3. **HTTPS**: Both GitHub Pages and Azure Functions use HTTPS by default 