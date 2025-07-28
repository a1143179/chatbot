module.exports = async function (context, req) {
  // Get request body
  const { message, userId } = req.body;
  
  // Get environment variable
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  try {
    // Call Google AI Studio API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `User says: ${message}. Please respond in Chinese, maintaining a friendly and natural conversation style.`
          }]
        }]
      })
    });
    
    const data = await response.json();
    
    // Return response
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: {
        response: data.candidates[0].content.parts[0].text,
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        error: 'Error occurred while processing request',
        message: error.message
      }
    };
  }
}; 