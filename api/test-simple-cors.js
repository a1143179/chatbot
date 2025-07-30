const https = require('https');

const apiUrl = 'https://chatbotprocessor.azurewebsites.net/api/process';

function makeRequest(method, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(apiUrl);
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: method,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function testCORS() {
    console.log('=== Simple CORS Test ===\n');
    
    // Test 1: OPTIONS request
    console.log('1. Testing OPTIONS preflight...');
    try {
        const optionsResponse = await makeRequest('OPTIONS', {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        });
        
        console.log('Status:', optionsResponse.status);
        console.log('CORS Headers:');
        console.log('  Access-Control-Allow-Origin:', optionsResponse.headers['access-control-allow-origin']);
        console.log('  Access-Control-Allow-Methods:', optionsResponse.headers['access-control-allow-methods']);
        console.log('  Access-Control-Allow-Headers:', optionsResponse.headers['access-control-allow-headers']);
        console.log('');
        
        if (optionsResponse.status === 200) {
            console.log('✅ OPTIONS request successful');
        } else {
            console.log('❌ OPTIONS request failed');
        }
    } catch (error) {
        console.error('❌ OPTIONS request error:', error.message);
    }
    
    // Test 2: POST request
    console.log('2. Testing POST request...');
    try {
        const postResponse = await makeRequest('POST', {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:3000'
        }, JSON.stringify({
            prompt: 'Test message'
        }));
        
        console.log('Status:', postResponse.status);
        console.log('Access-Control-Allow-Origin:', postResponse.headers['access-control-allow-origin']);
        
        if (postResponse.status === 200) {
            console.log('✅ POST request successful');
            console.log('Response:', postResponse.body);
        } else {
            console.log('❌ POST request failed');
            console.log('Response:', postResponse.body);
        }
    } catch (error) {
        console.error('❌ POST request error:', error.message);
    }
}

testCORS().catch(console.error); 