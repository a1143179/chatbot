const { app } = require('@azure/functions');

app.http('test', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        console.log('Test endpoint called - Deployment verification');
        context.log('Test endpoint called - Deployment verification');
        
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            jsonBody: {
                message: 'Azure Functions is working!',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                deployment: 'test-verification'
            }
        };
    }
}); 