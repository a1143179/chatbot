# API Logging Configuration

## Overview
All API functions have been configured to use **Information** level logging for better debugging and monitoring.

## Configuration Changes

### 1. Host Configuration (`host.json`)
```json
{
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    },
    "logLevel": {
      "default": "Information",
      "Host.Results": "Information", 
      "Function": "Information",
      "Host.Aggregator": "Information"
    }
  }
}
```

### 2. Function Updates
All functions now include detailed logging:

- **Process Function** (`process/index.js`): Logs request details, API calls, and responses
- **Health Function** (`health/index.js`): Logs health check calls and API key status
- **Database Functions** (`database.js`): Logs connection status and data operations

### 3. ES Module Compatibility
All functions updated to use ES module syntax:
- `import` instead of `require`
- `export default` instead of `module.exports`

## Log Levels

### Information Level (Default)
- Request/response details
- Function execution flow
- Database connection status
- API call results

### Error Level (Preserved)
- Database connection failures
- API processing errors
- Weather API errors
- General error conditions

## Deployment

### Quick Deploy
```bash
cd api
npm run deploy:logs
```

### Manual Deploy
```bash
cd api
func azure functionapp publish chatbotprocessor
```

## Monitoring

### Azure Portal
1. Go to your Function App in Azure Portal
2. Click "Monitor" → "Log stream"
3. View real-time logs with Information level details

### Local Development
```bash
cd api
npm start
```

## Log Examples

### Process Function
```
Process function called with method: POST
Request headers: {...}
Request body: {...}
Extracted prompt: Hello
Chat history length: 0
Language preference: english
API key configured: true
Calling Google AI API with prompt: Hello
AI response: Hello! How can I help you today?
AI interaction logged successfully, ID: 123
```

### Database Operations
```
mssql module loaded successfully
Database connection established successfully
AI interaction logged successfully, ID: 123
```

### Error Handling
```
Database connection failed: ConnectionError: Failed to connect
Failed to log AI interaction: Connection timeout
Error processing with Google AI: API key invalid
```

## Benefits

1. **Better Debugging**: Detailed logs help identify issues quickly
2. **Performance Monitoring**: Track response times and API calls
3. **Database Tracking**: Monitor data recording operations
4. **Error Tracing**: Clear error messages with context
5. **Production Monitoring**: Real-time visibility into function execution

## Next Steps

After deployment, monitor the logs to:
1. Verify database connections are working
2. Confirm user prompts and AI responses are being recorded
3. Track any errors or performance issues
4. Monitor API usage patterns 