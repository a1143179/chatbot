# Deployment Guide

This guide explains how to deploy the chatbot application using **GitHub Pages for the frontend** and **Azure Functions for the backend**. The frontend and backend are deployed and managed separately.

---

## Architecture Overview

- **Frontend**: React app (entire project), deployed to GitHub Pages (main branch, `build` directory, no `docs` folder required)
- **Backend**: Node.js Azure Functions under `/api`, deployed to Azure
- **Repository**: Single repository containing both frontend and backend code

---

## 1. Frontend Deployment (GitHub Pages)

### 1.1 Build the React App
```bash
npm run build
```

### 1.2 Push to Main Branch
```bash
git add .
git commit -m "Build frontend"
git push
```

### 1.3 Configure GitHub Pages
1. Go to your repository → **Settings** → **Pages**
2. Source: Select **Deploy from a branch**
3. Branch: `main`
4. Folder: `/build`
5. Click **Save**

### 1.4 Access Your Site
- Your app will be available at: `https://your-username.github.io/your-repo-name`

### 1.5 API URL Configuration
- The frontend communicates with the backend via the API URL (see `src/config.ts`).
- Make sure the API URL points to your deployed Azure Function endpoint, e.g.:
  ```typescript
  const config: Config = {
    apiUrl: process.env.REACT_APP_API_URL || 'https://your-func-app-name.azurewebsites.net/api/processor',
    environment: (process.env.NODE_ENV as 'development' | 'production') || 'development'
  };
  ```

---

## 2. Backend Deployment (Azure Functions)

### 2.1 Create Azure Function App
1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **Function App** (Node.js runtime, Consumption plan)
3. Set environment variable `GOOGLE_AI_API_KEY` in Application settings

### 2.2 Prepare Azure Service Principal (for CI/CD)
1. Install Azure CLI
2. Login: `az login`
3. Create service principal:
   ```bash
   az ad sp create-for-rbac --name "chatbot-deployment" --role contributor \
     --scopes /subscriptions/your-subscription-id \
     --sdk-auth
   ```
4. Save the JSON output for GitHub Secrets

### 2.3 Configure GitHub Secrets
- Go to your repository → **Settings** → **Secrets and variables** → **Actions**
- Add:
  - `AZURE_CREDENTIALS`: Paste the JSON from above
  - `AZURE_FUNCTION_APP_NAME`: Your Function App name

### 2.4 Deploy Backend
- Use the provided GitHub Actions workflow (`.github/workflows/deploy-backend.yml`) or Azure CLI to deploy `/api` directory to Azure Functions
- The backend API will be available at: `https://your-func-app-name.azurewebsites.net/api/processor`

---

## 3. Local Development

### 3.1 Frontend
```bash
npm start
```

### 3.2 Backend (Azure Functions Local)
```bash
cd api
func start
```

- Configure local environment variables in `api/local.settings.json` (do not commit this file)

---

## 4. Testing

### 4.1 Frontend
```bash
npm test
```

### 4.2 Backend
```bash
cd api
npm test
npm run test:coverage
```

---

## 5. FAQ

### Why don't I need a docs folder?
- GitHub Pages now supports deploying from the `build` directory of your main branch, so you do **not** need a `docs` folder unless you want to keep both source and static files in the same branch and directory.
- Using the `build` directory is simpler and recommended for React projects.

### Can I use a custom domain?
- Yes, configure it in GitHub Pages settings after deployment.

### How does the frontend talk to the backend?
- The frontend makes HTTP requests to the Azure Functions API endpoint. Make sure CORS is enabled in your Azure Functions responses.

---

For more details, see the comments in your workflow files and [README.md](README.md). 