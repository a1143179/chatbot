const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLocalhostAPI() {
  const apiUrl = 'https://chatbotprocessor.azurewebsites.net/api/process';
  
  console.log('Testing API endpoint for localhost development:', apiUrl);
  
  try {
    // Test OPTIONS request (CORS preflight) from localhost
    console.log('\n1. Testing OPTIONS request from localhost:3000...');
    const optionsResponse = await fetch(apiUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('OPTIONS Status:', optionsResponse.status);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers')
    });
    
    // Test POST request with valid data from localhost
    console.log('\n2. Testing POST request from localhost:3000...');
    const postResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        prompt: 'Hello from localhost!'
      })
    });
    
    console.log('POST Status:', postResponse.status);
    console.log('Response Headers:', {
      'Content-Type': postResponse.headers.get('Content-Type'),
      'Access-Control-Allow-Origin': postResponse.headers.get('Access-Control-Allow-Origin')
    });
    
    if (postResponse.ok) {
      const data = await postResponse.json();
      console.log('Response Data:', data);
    } else {
      const errorText = await postResponse.text();
      console.log('Error Response:', errorText);
    }
    
    // Test with localhost:3001 as well
    console.log('\n3. Testing POST request from localhost:3001...');
    const postResponse2 = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      },
      body: JSON.stringify({
        prompt: 'Hello from localhost:3001!'
      })
    });
    
    console.log('POST Status (3001):', postResponse2.status);
    console.log('Response Headers (3001):', {
      'Content-Type': postResponse2.headers.get('Content-Type'),
      'Access-Control-Allow-Origin': postResponse2.headers.get('Access-Control-Allow-Origin')
    });
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testLocalhostAPI(); 