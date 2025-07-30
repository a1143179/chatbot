module.exports = async function (context, req) {
    // Let Azure Functions handle CORS globally via host.json configuration
    
    // Check if Google AI API key is configured
    const apiKeyConfigured = !!process.env.GOOGLE_AI_API_KEY;
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production',
            apiKeyConfigured: apiKeyConfigured,
            message: apiKeyConfigured ? 'Service is ready' : 'Warning: Google AI API key not configured'
        }
    };
}; 