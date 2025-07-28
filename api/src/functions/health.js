const { app } = require('@azure/functions');

app.http('health', {
    methods: ['GET', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Add debugging
        console.log('Health endpoint called');
        context.log('Health endpoint called');
        
        // Get current timestamp
        const timestamp = new Date().toISOString();
        
        // Check if Google AI API key is configured
        const apiKeyConfigured = !!process.env.GOOGLE_AI_API_KEY;
        
        // Basic health check response
        const healthStatus = {
            status: 'healthy',
            timestamp: timestamp,
            service: 'chatbot-api',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'production',
            checks: {
                googleAI: {
                    configured: apiKeyConfigured,
                    status: apiKeyConfigured ? 'ready' : 'not_configured'
                },
                azureFunctions: {
                    status: 'running',
                    runtime: 'node'
                }
            }
        };

        // Set response status based on health checks
        const isHealthy = apiKeyConfigured;
        const statusCode = isHealthy ? 200 : 503;

        console.log('Health check completed, status:', statusCode);
        context.log('Health check completed, status:', statusCode);

        // Return response
        return {
            status: statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            jsonBody: healthStatus
        };
    }
}); 