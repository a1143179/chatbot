# VRM虚拟助手

一个基于Azure Static Web Apps的VRM虚拟助手，支持语音交互和AI对话。

## 功能特性

- 🎭 **VRM虚拟形象**：显示3D虚拟角色
- 🎤 **语音识别**：使用浏览器STT API进行语音输入
- 🤖 **AI对话**：集成Google AI Studio进行智能对话
- 🔊 **语音合成**：使用浏览器TTS API播放AI回复
- 🌐 **云端部署**：自动部署到Azure Static Web Apps

## 技术栈

- **前端**：React + TypeScript + Three.js + VRM
- **后端**：Azure Functions (Serverless)
- **AI服务**：Google AI Studio (Gemini Pro)
- **语音**：Web Speech API (STT + TTS)
- **部署**：Azure Static Web Apps + GitHub Actions

## 项目结构

```
/
├── api/processor/           # Azure Function - AI处理器
│   ├── index.js
│   └── function.json
├── public/
│   ├── models/             # VRM模型文件
│   │   └── cute-girl.vrm
│   └── index.html
├── src/
│   ├── App.tsx            # 主应用组件
│   └── App.css            # 样式文件
├── .github/workflows/      # GitHub Actions
├── staticwebapp.config.json # Azure Static Web Apps配置
└── README.md
```

## 本地开发

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **启动开发服务器**：
   ```bash
   npm start
   ```

3. **访问应用**：
   打开 http://localhost:3000

## 部署配置

### 环境变量设置

在Azure门户中配置以下环境变量：

- `GOOGLE_AI_API_KEY`：Google AI Studio API密钥

### 部署步骤

1. **创建Azure Static Web App**
2. **配置GitHub Actions**
3. **设置环境变量**
4. **推送代码到main分支**

## 使用方法

1. 点击"开始录音"按钮
2. 说出您的问题或请求
3. 等待AI处理和回复
4. 系统会自动播放语音回复

## API端点

- `POST /api/processor`：处理用户输入并返回AI回复

## 许可证

MIT License
