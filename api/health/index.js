module.exports = async function (context, req) {
    // Add debugging
    console.log('Health endpoint called - Simple test');
    context.log('Health endpoint called - Simple test');
    
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Simple health check response
    const healthStatus = {
        status: 'healthy',
        timestamp: timestamp,
        service: 'chatbot-api',
        version: '1.0.1',
        environment: process.env.NODE_ENV || 'production',
        deployment: 'simple-test',
        message: 'Health check is working!'
    };

    console.log('Health check completed, status: 200');
    context.log('Health check completed, status: 200');

    // Set response headers
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: healthStatus
    };
}; 