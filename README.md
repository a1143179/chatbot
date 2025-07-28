# VRM Virtual Assistant

A VRM virtual assistant with voice interaction and AI conversation capabilities, deployed using GitHub Pages for frontend and Azure Functions for backend.

## Features

- 🎭 **VRM Virtual Avatar**: Display 3D virtual character (coming soon)
- 🎤 **Speech Recognition**: Use browser STT API for voice input
- 🤖 **AI Conversation**: Integrate Google AI Studio for intelligent dialogue
- 🔊 **Speech Synthesis**: Use browser TTS API to play AI responses
- 🌐 **Cloud Deployment**: GitHub Pages (Frontend) + Azure Functions (Backend)

## Tech Stack

- **Frontend**: React + TypeScript + Three.js + VRM
- **Backend**: Azure Functions (Serverless)
- **AI Service**: Google AI Studio (Gemini Pro)
- **Speech**: Web Speech API (STT + TTS)
- **Deployment**: GitHub Pages + Azure Functions + GitHub Actions

## Project Structure

```
/
├── api/processor/           # Azure Function - AI Processor
│   ├── index.js
│   └── function.json
├── public/
│   ├── models/             # VRM Model Files
│   │   └── cute-girl.vrm
│   └── index.html
├── src/
│   ├── App.tsx            # Main Application Component
│   ├── config.ts          # Environment Configuration
│   └── App.css            # Style Files
├── .github/workflows/      # GitHub Actions
│   ├── deploy-frontend.yml # GitHub Pages Deployment
│   └── deploy-backend.yml  # Azure Functions Deployment
├── DEPLOYMENT.md          # Detailed Deployment Guide
└── README.md
```

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Access Application**:
   Open http://localhost:3000

## Deployment Configuration

### Environment Variables Setup

Configure the following environment variables:

**Azure Functions (Backend)**:
- `GOOGLE_AI_API_KEY`: Google AI Studio API Key

**Frontend Configuration**:
- Update `src/config.ts` with your Azure Function URL

### Deployment Steps

1. **Setup Azure Functions**
   - Create Function App in Azure Portal
   - Configure environment variables
   - Get Function App URL

2. **Setup GitHub Repository**
   - Configure GitHub Secrets
   - Enable GitHub Pages
   - Update configuration files

3. **Deploy**
   - Push code to main branch
   - Monitor deployment in GitHub Actions

## Usage

1. Click "Start Recording" button
2. Speak your question or request
3. Wait for AI processing and response
4. System will automatically play voice response

## API Endpoints

- `POST /api/processor`: Process user input and return AI response
- `GET /api/health`: Health check endpoint for monitoring service status

## Deployment URLs

- **Frontend**: `https://your-username.github.io/chatbot`
- **Backend**: `https://your-function-app.azurewebsites.net/api/processor`

## Cost Optimization

- **GitHub Pages**: Free for public repositories
- **Azure Functions**: Pay-per-use consumption plan
- **Google AI**: Check pricing for API calls

## License

MIT License

## 🚀 Deployment Overview

This project uses a **frontend-backend separation** architecture:

- **Frontend**: Entire React project, deployed to GitHub Pages (main branch, using the `build` directory, no `docs` folder required)
- **Backend**: Node.js Azure Functions under `/api`, deployed separately to Azure

### Why you do NOT need a `docs` folder
- Modern GitHub Pages allows you to publish from the `main` branch's `/` (root) or `/build` directory.
- The `docs` folder is only needed if you want to keep both source code and static site in the same branch and don't want to use the `build` directory directly.
- **Recommended:** Use the `build` directory as your GitHub Pages source. No need for a `docs` folder.

---

## 🌐 Frontend Deployment (GitHub Pages)

1. **Build the React app**
   ```bash
   npm run build
   ```
2. **Push to main branch**
   ```bash
   git add .
   git commit -m "Build frontend"
   git push
   ```
3. **Configure GitHub Pages**
   - Go to your repository → Settings → Pages
   - Source: Select "Deploy from a branch"
   - Branch: `main`
   - Folder: `/build`
   - Click "Save"
4. **Access your site**
   - Your app will be available at: `https://your-username.github.io/your-repo-name`

---

## ☁️ Backend Deployment (Azure Functions)

1. **Prepare Azure Function App**
   - Create a Function App in Azure Portal (Node.js runtime)
   - Set environment variable `GOOGLE_AI_API_KEY`
2. **Deploy backend**
   - The `/api` directory contains your Azure Functions code
   - Use the provided GitHub Actions workflow or Azure CLI to deploy
3. **API Endpoint**
   - Your backend API will be available at: `https://your-func-app-name.azurewebsites.net/api/processor`

---

## 🔗 Frontend-Backend Integration

- The frontend React app communicates with the backend via the API URL (see `src/config.ts`).
- Make sure the API URL in your frontend config points to your deployed Azure Function endpoint.

---

## 🧪 Testing

### Frontend
```bash
npm test
```

### Backend
```bash
cd api
npm test
npm run test:coverage
```

---

For detailed deployment steps, see [DEPLOYMENT.md](DEPLOYMENT.md).
