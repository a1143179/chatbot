module.exports = async function (context, req) {
    console.log('Test endpoint called - Deployment verification');
    context.log('Test endpoint called - Deployment verification');
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: {
            message: 'Azure Functions is working!',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'production',
            deployment: 'test-verification'
        }
    };
}; 