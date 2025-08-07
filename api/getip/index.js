const https = require('https');

module.exports = async function (context, req) {
    try {
        // Method 1: Get IP from external service
        const externalIP = await getExternalIP();
        
        // Method 2: Get IP from request headers (if behind proxy)
        const forwardedFor = req.headers['x-forwarded-for'];
        const realIP = req.headers['x-real-ip'];
        const azureClientIP = req.headers['x-azure-clientip'];
        
        const response = {
            externalIP: externalIP,
            headers: {
                'x-forwarded-for': forwardedFor,
                'x-real-ip': realIP,
                'x-azure-clientip': azureClientIP
            },
            allHeaders: req.headers,
            timestamp: new Date().toISOString()
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: response
        };
    } catch (error) {
        context.log.error('Error getting IP:', error);
        context.res = {
            status: 500,
            body: { error: 'Failed to get IP address', details: error.message }
        };
    }
};

function getExternalIP() {
    return new Promise((resolve, reject) => {
        https.get('https://api.ipify.org?format=json', (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.ip);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}
