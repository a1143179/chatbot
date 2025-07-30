const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const apiUrl = 'https://chatbotprocessor.azurewebsites.net/api/process';

async function testCORS() {
    console.log('=== CORS Test for Azure Functions ===\n');
    
    // Test 1: OPTIONS preflight request
    console.log('1. Testing OPTIONS preflight request...');
    try {
        const optionsResponse = await fetch(apiUrl, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://a1143179.github.io',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        
        console.log('OPTIONS Status:', optionsResponse.status);
        console.log('CORS Headers:');
        console.log('  Access-Control-Allow-Origin:', optionsResponse.headers.get('Access-Control-Allow-Origin'));
        console.log('  Access-Control-Allow-Methods:', optionsResponse.headers.get('Access-Control-Allow-Methods'));
        console.log('  Access-Control-Allow-Headers:', optionsResponse.headers.get('Access-Control-Allow-Headers'));
        console.log('  Access-Control-Max-Age:', optionsResponse.headers.get('Access-Control-Max-Age'));
        console.log('  Access-Control-Allow-Credentials:', optionsResponse.headers.get('Access-Control-Allow-Credentials'));
        console.log('');
    } catch (error) {
        console.error('OPTIONS request failed:', error.message);
    }
    
    // Test 2: POST request with CORS headers
    console.log('2. Testing POST request with CORS headers...');
    try {
        const postResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://a1143179.github.io'
            },
            body: JSON.stringify({
                prompt: 'Hello, test message'
            })
        });
        
        console.log('POST Status:', postResponse.status);
        console.log('Response Headers:');
        console.log('  Access-Control-Allow-Origin:', postResponse.headers.get('Access-Control-Allow-Origin'));
        console.log('  Content-Type:', postResponse.headers.get('Content-Type'));
        
        if (postResponse.ok) {
            const data = await postResponse.json();
            console.log('Response Data:', data);
        } else {
            const errorText = await postResponse.text();
            console.log('Error Response:', errorText);
        }
        console.log('');
    } catch (error) {
        console.error('POST request failed:', error.message);
    }
    
    // Test 3: Test with different origin
    console.log('3. Testing with localhost origin...');
    try {
        const localhostResponse = await fetch(apiUrl, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        
        console.log('Localhost OPTIONS Status:', localhostResponse.status);
        console.log('Localhost CORS Origin:', localhostResponse.headers.get('Access-Control-Allow-Origin'));
        console.log('');
    } catch (error) {
        console.error('Localhost test failed:', error.message);
    }
}

testCORS().catch(console.error); 