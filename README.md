# VRM Virtual Assistant

A VRM virtual assistant with voice interaction and AI conversation capabilities, deployed using GitHub Pages for frontend and Azure Functions for backend.

## Features

- 🎭 **VRM Virtual Avatar**: Display 3D virtual character with animations
- 🎤 **Speech Recognition**: Use browser STT API for voice input
- 🤖 **AI Conversation**: Integrate Google AI Studio for intelligent dialogue
- 🔊 **Speech Synthesis**: Use browser TTS API to play AI responses
- 🌐 **Cloud Deployment**: GitHub Pages (Frontend) + Azure Functions (Backend)
- 🔄 **Real-time Processing**: Voice-to-text → AI processing → Text-to-speech

## Tech Stack

- **Frontend**: React + TypeScript + Three.js + VRM
- **Backend**: Azure Functions (Node.js 22, Consumption Plan)
- **AI Service**: Google AI Studio (Gemini Pro)
- **Speech**: Web Speech API (STT + TTS)
- **Deployment**: GitHub Pages + Azure Functions + GitHub Actions

## Project Structure

```
/
├── api/                     # Azure Functions Backend
│   ├── src/
│   │   └── functions/      # New Azure Functions Programming Model
│   │       ├── health.js   # Health check endpoint
│   │       └── process.js  # AI processing endpoint
│   ├── package.json        # Backend dependencies
│   ├── host.json          # Azure Functions configuration
│   └── local.settings.json # Local development settings
├── public/
│   ├── models/             # VRM Model Files
│   │   ├── cute-girl.vrm
│   │   └── *.vrma         # Animation files
│   └── index.html
├── src/
│   ├── App.tsx            # Main Application Component
│   ├── config.ts          # Environment Configuration
│   └── App.css            # Style Files
├── .github/workflows/      # GitHub Actions
│   ├── deploy-frontend.yml # GitHub Pages Deployment
│   └── deploy-functions.yml # Azure Functions Deployment
├── DEPLOYMENT.md          # Detailed Deployment Guide
└── README.md
```

## Local Development

### Frontend Development

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

### Backend Development

1. **Navigate to API directory**:
   ```bash
   cd api
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Azure Functions locally**:
   ```bash
   func start
   ```

4. **Test endpoints**:
   - Health: http://localhost:7071/api/health
   - Process: http://localhost:7071/api/process

## Deployment Configuration

### Environment Variables Setup

Configure the following environment variables:

**Azure Functions (Backend)**:
- `GOOGLE_AI_API_KEY`: Google AI Studio API Key

**Frontend Configuration**:
- Update `src/config.ts` with your Azure Function URL

### Deployment Steps

1. **Setup Azure Functions**
   - Create Function App in Azure Portal (Node.js 20, Consumption Plan)
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

### Health Check
- **URL**: `GET /api/health`
- **Purpose**: Monitor service status and configuration
- **Response**: JSON with service health, timestamp, and configuration status

### AI Processing
- **URL**: `POST /api/process`
- **Purpose**: Process user input and return AI response
- **Request Body**: `{ "prompt": "user message" }`
- **Response**: JSON with AI response, timestamp, and model info

## Deployment URLs

- **Frontend**: `https://your-username.github.io/chatbot`
- **Backend**: `https://your-function-app.azurewebsites.net/api/`

## Azure Functions Architecture

### New Programming Model
This project uses the **new Azure Functions Node.js programming model**:

- **File Structure**: Functions in `src/functions/*.js`
- **Package.json**: `"main": "src/functions/*.js"`
- **No function.json**: Not required in new model
   - **Runtime**: Node.js 22 LTS
- **Plan**: Consumption (Serverless)

### Function Structure
```javascript
const { app } = require('@azure/functions');

app.http('functionName', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Function logic here
        return { jsonBody: { message: 'Hello' } };
    }
});
```

## Cost Optimization

- **GitHub Pages**: Free for public repositories
- **Azure Functions**: Pay-per-use consumption plan
- **Google AI**: Check pricing for API calls

## Testing

### Frontend Tests
```bash
npm test
```

### Backend Tests
```bash
cd api
npm test
npm run test:coverage
```

### Local Function Testing
```bash
cd api
func start
curl http://localhost:7071/api/health
```

## Troubleshooting

### Common Issues

1. **Functions not detected in Azure Portal**
   - Ensure you're using Consumption plan (not App Service plan)
   - Verify `"main": "src/functions/*.js"` in package.json
   - Check Node.js version is 22 LTS

2. **404 errors on endpoints**
   - Verify functions are deployed correctly
   - Check Azure Portal → Functions section
   - Ensure correct Function App URL in frontend config

3. **Speech recognition not working**
   - Ensure HTTPS is used (required for Web Speech API)
   - Check browser permissions for microphone access

## License

MIT License

## 🚀 Deployment Overview

This project uses a **frontend-backend separation** architecture:

- **Frontend**: Entire React project, deployed to GitHub Pages (main branch, using the `build` directory)
- **Backend**: Node.js Azure Functions under `/api`, deployed to Azure Functions Consumption plan

### Frontend Deployment (GitHub Pages)

1. **Build the React app**
   ```bash
   npm run build
   ```
2. **Push to main branch**
   ```bash
   git add . ; git commit -m "Build frontend" ; git push
   ```
3. **Configure GitHub Pages**
   - Go to your repository → Settings → Pages
   - Source: Select "Deploy from a branch"
   - Branch: `main`
   - Folder: `/build`
   - Click "Save"

### Backend Deployment (Azure Functions)

1. **Create Function App in Azure Portal**
   - Runtime: Node.js 22 LTS
   - Plan: Consumption (Serverless)
   - Operating System: Windows or Linux

2. **Deploy using Azure Functions Core Tools**
   ```bash
   cd api
   func azure functionapp publish <FUNCTION_APP_NAME> --javascript --force
   ```

3. **Or use GitHub Actions**
   - Add `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` to GitHub Secrets
   - Push changes to trigger automatic deployment

### Frontend-Backend Integration

- The frontend React app communicates with the backend via the API URL (see `src/config.ts`)
- Make sure the API URL in your frontend config points to your deployed Azure Function endpoint

---

For detailed deployment steps, see [DEPLOYMENT.md](DEPLOYMENT.md).
