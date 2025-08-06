# VRM Virtual Assistant

A VRM virtual assistant with voice interaction and AI conversation capabilities, deployed using GitHub Pages for frontend and Azure Functions for backend.

## Features

- 🎭 **VRM Virtual Avatar**: Display 3D virtual character with animations
- 🎤 **Speech Recognition**: Use browser STT API for voice input
- 🤖 **AI Conversation**: Integrate Google AI Studio for intelligent dialogue
- 🔊 **Speech Synthesis**: Use browser TTS API to play AI responses
- 🌐 **Cloud Deployment**: GitHub Pages (Frontend) + Azure Functions (Backend)
- 🔄 **Real-time Processing**: Voice-to-text → AI processing → Text-to-speech
- 🚀 **Automated CI/CD**: GitHub Actions for seamless deployment
- 🧪 **Comprehensive Testing**: Jest tests for both frontend and backend
- 📝 **Code Quality**: ESLint + TypeScript for code quality assurance

## Tech Stack

- **Frontend**: React 19 + TypeScript + Three.js + VRM
- **Backend**: Azure Functions (Node.js 22, Consumption Plan)
- **AI Service**: Google AI Studio (Gemini Pro)
- **Speech**: Web Speech API (STT + TTS)
- **Deployment**: GitHub Pages + Azure Functions + GitHub Actions
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Testing**: Jest + React Testing Library
- **Code Quality**: ESLint + TypeScript

## Project Structure

```
/
├── api/                     # Azure Functions Backend
│   ├── health/             # Health function directory
│   │   ├── function.json   # Function configuration
│   │   └── index.js        # Function entry point
│   ├── process/            # Process function directory
│   │   ├── function.json   # Function configuration
│   │   └── index.js        # Function entry point
│   ├── testhealth/         # Test health function
│   │   ├── function.json   # Function configuration
│   │   └── index.js        # Function entry point
│   ├── src/
│   │   └── functions/      # Function source code
│   │       ├── health.js   # Health check endpoint
│   │       └── process.js  # AI processing endpoint
│   ├── package.json        # Backend dependencies
│   ├── host.json          # Azure Functions configuration
│   └── local.settings.json # Local development settings
├── public/
│   ├── models/             # VRM Model Files
│   │   ├── cute-girl.vrm
│   │   ├── Nahida.vrm
│   │   ├── pee.vrm
│   │   ├── star-rail.vrm
│   │   ├── twitch-girl.vrm
│   │   └── *.vrma         # Animation files
│   └── index.html
├── src/
│   ├── App.tsx            # Main Application Component
│   ├── config.ts          # Environment Configuration
│   ├── types/             # TypeScript type definitions
│   │   └── global.d.ts    # Global type declarations
│   └── App.css            # Style Files
├── .github/workflows/      # GitHub Actions
│   ├── test-backend.yml   # Backend testing workflow
│   ├── test-frontend.yml  # Frontend testing workflow
│   ├── test-and-deploy-backend.yml # Backend deployment
│   ├── test-and-deploy-frontend.yml # Frontend deployment
│   └── auto-create-pr.yml # Auto PR Creation
├── scripts/               # Development scripts
│   ├── check-all.sh      # Full project check script
│   ├── pre-commit.sh     # Pre-commit hook script
│   └── run-tests.js      # Test runner script
├── DEPLOYMENT.md          # Detailed Deployment Guide
├── NODE_22_UPGRADE.md    # Node.js 22 upgrade documentation
└── README.md
```

## Local Development Environment Setup

### Prerequisites

- **Node.js 22**: Required for both frontend and backend
- **npm**: Package manager
- **Azure Functions Core Tools**: For local backend development

### Project Structure

这是一个**全栈聊天机器人项目**：
- **前端**：React + TypeScript + Three.js + VRM（3D虚拟角色）
- **后端**：Azure Functions (Node.js)
- **AI服务**：Google AI Studio (Gemini Pro)

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

4. **Run Tests**:
   ```bash
   npm test
   npm run test:watch
   ```

5. **Code Quality Checks**:
   ```bash
   npm run lint
   npm run type-check
   npm run pre-commit
   ```

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
   npm start
   # or
   func start
   ```

4. **Test endpoints**:
   - Health: http://localhost:7071/api/health
   - Process: http://localhost:7071/api/process
   - Test Health: http://localhost:7071/api/testhealth

5. **Run Tests**:
   ```bash
   npm test
   npm run test:coverage
   npm run lint
   ```

### API Configuration Analysis

#### 当前API设置：
- **生产环境**：`https://chatbotprocessor.azurewebsites.net/api/process`
- **本地开发**：`http://localhost:7071/api/process`
- **配置位置**：`src/config.ts`

#### API端点：
- **主处理端点**：`/api/process` - AI对话处理
- **健康检查**：`/api/health` - 服务状态检查
- **测试端点**：`/api/testhealth` - 测试用健康检查

#### CORS配置：
```json
{
  "cors": {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET", "POST", "OPTIONS"],
    "allowedHeaders": ["Content-Type", "Authorization", "X-Requested-With", "Origin", "Accept"]
  }
}
```

### Environment Variables Configuration

#### 本地开发配置 (`api/local.settings.json`)：
```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "GOOGLE_AI_API_KEY": "your-google-ai-api-key-here"
  }
}
```

#### 需要配置的变量：
- `GOOGLE_AI_API_KEY`：Google AI Studio API密钥
- `DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`：数据库连接（如果使用Azure SQL）

### Development Tools and Scripts

#### 可用的npm脚本：
```bash
# 前端
npm start          # 启动React开发服务器
npm test           # 运行测试
npm run lint       # 代码检查
npm run type-check # TypeScript类型检查

# 后端
cd api
npm start          # 启动Azure Functions
npm test           # 运行API测试
npm run lint       # API代码检查

# 全项目
npm run full-pre-commit    # 完整的前后端检查
npm run full-build-check   # 构建检查
```

### Testing and Validation

#### 测试API端点：
```bash
# 健康检查
curl http://localhost:7071/api/health

# 测试处理端点
curl -X POST http://localhost:7071/api/process \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","language":"english"}'
```

#### 前端测试：
- 访问 http://localhost:3000
- 测试语音识别和AI对话功能
- 检查VRM模型加载和动画

### Development Environment Requirements

#### 必需工具：
- **Node.js 22**：项目要求
- **npm**：包管理器
- **Azure Functions Core Tools**：本地Azure Functions开发

#### 可选工具：
- **Azure Storage Emulator**：本地存储模拟
- **Visual Studio Code**：推荐的IDE

### Current Configuration Status

#### 前端配置：
- ✅ React开发服务器配置完成
- ✅ TypeScript配置完成
- ✅ 测试框架配置完成
- ✅ 代码质量检查配置完成

#### 后端配置：
- ✅ Azure Functions本地开发配置完成
- ✅ CORS配置完成
- ✅ 测试框架配置完成
- ⚠️ 需要配置Google AI API密钥
- ⚠️ 需要配置数据库连接（如果使用Azure SQL）

### Full Project Testing

```bash
# Run all tests and checks
npm run full-pre-commit

# Build check
npm run full-build-check
```

## CI/CD Pipeline

### GitHub Actions Workflows

1. **Test Backend** (`test-backend.yml`)
   - Triggers: Push to `main` or `working` branches
   - Runs: Backend tests, linting, and validation
   - Excludes: Merge commits

2. **Test Frontend** (`test-frontend.yml`)
   - Triggers: Push to `main` or `working` branches
   - Runs: Frontend tests, linting, and type checking
   - Excludes: Merge commits

3. **Deploy Backend** (`test-and-deploy-backend.yml`)
   - Triggers: PR merged to `main`
   - Runs: Tests + Deploy to Azure Functions
   - Environment: Production

4. **Deploy Frontend** (`test-and-deploy-frontend.yml`)
   - Triggers: PR merged to `main`
   - Runs: Tests + Deploy to GitHub Pages
   - Environment: Production

### Pre-commit Hooks

The project uses Husky for pre-commit hooks:
- **Frontend**: ESLint + TypeScript + Jest tests
- **Backend**: ESLint + Jest tests
- **Full Check**: Both frontend and backend validation

## Deployment Configuration

### Environment Variables Setup

Configure the following environment variables:

**Azure Functions (Backend)**:
- `GOOGLE_AI_API_KEY`: Google AI Studio API Key

**Frontend Configuration**:
- Update `src/config.ts` with your Azure Function URL

### Deployment Steps

1. **Setup Azure Functions**
   - Create Function App in Azure Portal (Node.js 22, Consumption Plan)
   - Configure environment variables
   - Get Function App URL

2. **Setup GitHub Repository**
   - Configure GitHub Secrets (`AZURE_CREDENTIALS`)
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

### Test Health
- **URL**: `GET /api/testhealth`
- **Purpose**: Test endpoint for development
- **Response**: JSON with test status

## Deployment URLs

- **Frontend**: `https://a1143179.github.io/chatbot`
- **Backend**: `https://chatbotprocessor.azurewebsites.net/api/`
- **Health Check**: `https://chatbotprocessor.azurewebsites.net/api/health`
- **Process Endpoint**: `https://chatbotprocessor.azurewebsites.net/api/process`

## Azure Functions Architecture

### Traditional Programming Model
This project uses the **traditional Azure Functions Node.js programming model** for better stability:

- **File Structure**: Each function has its own directory with `function.json` and `index.js`
- **Function Configuration**: `function.json` defines HTTP triggers and routes
- **Entry Points**: `index.js` files in each function directory
- **Runtime**: Node.js 22 LTS
- **Plan**: Consumption (Serverless)

### Function Structure
```javascript
// Traditional model - index.js
module.exports = async function (context, req) {
    // Function logic here
    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { message: 'Hello' }
    };
};
```

```json
// function.json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get", "post"],
      "route": "health"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

## Node.js 22 Upgrade

This project has been upgraded to Node.js 22 for:
- **Better Performance**: Faster startup times and memory management
- **Enhanced Security**: Latest security patches and crypto modules
- **Modern Features**: ES2022 support and improved TypeScript compatibility

### Local Development with Node.js 22

```bash
# Using nvm
nvm install 22
nvm use 22

# Verify version
node --version  # Should show v22.x.x
```

## Cost Optimization

- **GitHub Pages**: Free for public repositories
- **Azure Functions**: Pay-per-use consumption plan
- **Google AI**: Check pricing for API calls

## Testing

### Frontend Tests
```bash
npm test
npm run test:watch
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

### Full Test Suite
```bash
# Run all tests
npm run full-pre-commit

# Build verification
npm run full-build-check
```

## Troubleshooting

### Common Issues

1. **Functions not detected in Azure Portal**
   - Ensure you're using Consumption plan (not App Service plan)
   - Verify function directories have `function.json` and `index.js`
   - Check Node.js version is 22 LTS
   - Ensure `host.json` has correct `routePrefix` configuration

2. **404 errors on endpoints**
   - Verify functions are deployed correctly
   - Check Azure Portal → Functions section
   - Ensure correct Function App URL in frontend config
   - Verify `host.json` contains `"routePrefix": "api"`

3. **Deployment issues**
   - Use Azure Functions Core Tools for reliable deployment
   - Ensure deployment package has correct structure
   - Check GitHub Actions logs for deployment errors

4. **Speech recognition not working**
   - Ensure HTTPS is used (required for Web Speech API)
   - Check browser permissions for microphone access

5. **Node.js version issues**
   - Ensure Node.js 22 is installed locally
   - Use `.nvmrc` files for automatic version switching
   - Clear node_modules and reinstall if needed

### Recent Fixes

- ✅ **Upgraded to Node.js 22**: Better performance and security
- ✅ **Fixed deployment structure**: Using traditional Azure Functions model
- ✅ **Added proper function.json files**: For each function directory
- ✅ **Improved deployment workflow**: With cleanup and proper package structure
- ✅ **Enhanced CI/CD pipeline**: Comprehensive testing and deployment
- ✅ **Added pre-commit hooks**: Code quality assurance
- ✅ **Improved test coverage**: Both frontend and backend tests

## Development Scripts

### Available Scripts

**Frontend Scripts:**
- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript check

**Backend Scripts:**
- `cd api && npm test` - Run backend tests
- `cd api && npm run lint` - Run backend linting
- `cd api && npm start` - Start local functions

**Full Project Scripts:**
- `npm run full-pre-commit` - Run all tests and checks
- `npm run full-build-check` - Complete build verification
- `npm run api:test` - Test backend from root
- `npm run api:lint` - Lint backend from root

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

2. **Configure Environment Variables**
   - `GOOGLE_AI_API_KEY`: Your Google AI Studio API key

3. **Deploy using GitHub Actions (Recommended)**
   - Configure `AZURE_CREDENTIALS` in GitHub Secrets
   - Push changes to trigger automatic deployment
   - Deployment includes cleanup and proper package structure

4. **Manual Deployment using Azure Functions Core Tools**
   ```bash
   cd api
   func azure functionapp publish chatbotprocessor --javascript
   ```

5. **Verify Deployment**
   - Check health endpoint: `https://chatbotprocessor.azurewebsites.net/api/health`
   - Verify all functions are listed in Azure Portal

### Frontend-Backend Integration

- The frontend React app communicates with the backend via the API URL (see `src/config.ts`)
- Make sure the API URL in your frontend config points to your deployed Azure Function endpoint

---

For detailed deployment steps, see [DEPLOYMENT.md](DEPLOYMENT.md).

For Node.js 22 upgrade details, see [NODE_22_UPGRADE.md](NODE_22_UPGRADE.md).
