module.exports = async function (context, req) {
    console.log('Health endpoint called - Minimal test');
    context.log('Health endpoint called - Minimal test');
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            message: 'Hello from Azure Functions!',
            timestamp: new Date().toISOString()
        }
    };
}; 