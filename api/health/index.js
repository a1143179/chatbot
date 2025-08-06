export default async function (context, _req) {
    console.log('Health check function called');
    
    // Let Azure Functions handle CORS globally via host.json configuration
    
    // Check if Google AI API key is configured
    const apiKeyConfigured = !!process.env.GOOGLE_AI_API_KEY;
    console.log('API key configured:', apiKeyConfigured);
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
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