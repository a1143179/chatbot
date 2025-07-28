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

## 🌐 GitHub Pages Setup

### Quick Setup

1. **Enable GitHub Pages**:
   - Go to your repository → Settings → Pages
   - Source: Select "Deploy from a branch"
   - Branch: Select "main"
   - Folder: Select "/docs"
   - Click "Save"

2. **Deploy manually**:
   ```bash
   npm run deploy
   git add docs/
   git commit -m "Deploy to GitHub Pages"
   git push
   ```

3. **Automatic deployment**:
   - Push to `main` branch
   - GitHub Actions will automatically deploy to `docs` folder
   - Your site will be available at: `https://your-username.github.io/your-repo-name`

For detailed setup instructions, see [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md).

## 🚀 Deployment

### Prerequisites

1. **Azure Account**: You need an Azure subscription
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Azure CLI**: Install Azure CLI for local development

### Quick Setup

1. **Create Azure Service Principal**:
   ```bash
   # Windows
   .\setup-azure-sp.ps1
   
   # Linux/macOS
   chmod +x setup-azure-sp.sh
   ./setup-azure-sp.sh
   ```

2. **Configure GitHub Secrets**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add `AZURE_CREDENTIALS` with the JSON from step 1
   - Add `AZURE_FUNCTION_APP_NAME` with your function app name

3. **Create Azure Function App**:
   - Go to Azure Portal
   - Create a new Function App with Node.js runtime
   - Set environment variable `GOOGLE_AI_API_KEY`

4. **Deploy**:
   - Push to `main` branch
   - GitHub Actions will automatically deploy

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🧪 Testing

### Frontend Testing
```bash
npm test
```

### Backend Testing
```bash
cd api
npm test
npm run test:coverage
```
