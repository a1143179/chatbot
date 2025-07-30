const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  const apiUrl = 'https://chatbotprocessor.azurewebsites.net/api/process';
  
  console.log('Testing API endpoint:', apiUrl);
  
  try {
    // Test OPTIONS request (CORS preflight)
    console.log('\n1. Testing OPTIONS request...');
    const optionsResponse = await fetch(apiUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://a1143179.github.io',
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
    
    // Test POST request with valid data
    console.log('\n2. Testing POST request with valid data...');
    const postResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://a1143179.github.io'
      },
      body: JSON.stringify({
        prompt: 'Hello, how are you?'
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
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI(); 