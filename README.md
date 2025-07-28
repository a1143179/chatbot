# VRM Virtual Assistant

A VRM virtual assistant based on Azure Static Web Apps with voice interaction and AI conversation capabilities.

## Features

- 🎭 **VRM Virtual Avatar**: Display 3D virtual character
- 🎤 **Speech Recognition**: Use browser STT API for voice input
- 🤖 **AI Conversation**: Integrate Google AI Studio for intelligent dialogue
- 🔊 **Speech Synthesis**: Use browser TTS API to play AI responses
- 🌐 **Cloud Deployment**: Automatic deployment to Azure Static Web Apps

## Tech Stack

- **Frontend**: React + TypeScript + Three.js + VRM
- **Backend**: Azure Functions (Serverless)
- **AI Service**: Google AI Studio (Gemini Pro)
- **Speech**: Web Speech API (STT + TTS)
- **Deployment**: Azure Static Web Apps + GitHub Actions

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
│   └── App.css            # Style Files
├── .github/workflows/      # GitHub Actions
├── staticwebapp.config.json # Azure Static Web Apps Configuration
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

Configure the following environment variables in Azure Portal:

- `GOOGLE_AI_API_KEY`: Google AI Studio API Key

### Deployment Steps

1. **Create Azure Static Web App**
2. **Configure GitHub Actions**
3. **Set Environment Variables**
4. **Push Code to Main Branch**

## Usage

1. Click "Start Recording" button
2. Speak your question or request
3. Wait for AI processing and response
4. System will automatically play voice response

## API Endpoints

- `POST /api/processor`: Process user input and return AI response

## License

MIT License
