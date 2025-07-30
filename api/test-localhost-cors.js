const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const apiUrl = 'https://chatbotprocessor.azurewebsites.net/api/process';

async function testLocalhostCORS() {
    console.log('=== Testing CORS for localhost:3000 ===\n');
    
    // Test OPTIONS request from localhost:3000
    console.log('1. Testing OPTIONS preflight from localhost:3000...');
    try {
        const optionsResponse = await fetch(apiUrl, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        
        console.log('Status:', optionsResponse.status);
        console.log('Access-Control-Allow-Origin:', optionsResponse.headers.get('Access-Control-Allow-Origin'));
        console.log('Access-Control-Allow-Methods:', optionsResponse.headers.get('Access-Control-Allow-Methods'));
        console.log('Access-Control-Allow-Headers:', optionsResponse.headers.get('Access-Control-Allow-Headers'));
        console.log('');
        
        if (optionsResponse.status === 200 && optionsResponse.headers.get('Access-Control-Allow-Origin') === 'http://localhost:3000') {
            console.log('✅ CORS preflight successful for localhost:3000');
        } else {
            console.log('❌ CORS preflight failed for localhost:3000');
        }
    } catch (error) {
        console.error('❌ OPTIONS request failed:', error.message);
    }
    
    // Test POST request from localhost:3000
    console.log('2. Testing POST request from localhost:3000...');
    try {
        const postResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:3000'
            },
            body: JSON.stringify({
                prompt: 'Test message from localhost'
            })
        });
        
        console.log('Status:', postResponse.status);
        console.log('Access-Control-Allow-Origin:', postResponse.headers.get('Access-Control-Allow-Origin'));
        
        if (postResponse.ok) {
            const data = await postResponse.json();
            console.log('✅ POST request successful:', data.response ? 'Got response' : 'No response');
        } else {
            const errorText = await postResponse.text();
            console.log('❌ POST request failed:', errorText);
        }
    } catch (error) {
        console.error('❌ POST request failed:', error.message);
    }
}

testLocalhostCORS().catch(console.error); 