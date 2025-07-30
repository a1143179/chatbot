module.exports = async function (context, _req) {
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        },
        body: {
            status: "ok",
            message: "Azure Functions is running",
            timestamp: new Date().toISOString()
        }
    };
}; 