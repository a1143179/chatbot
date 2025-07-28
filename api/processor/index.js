module.exports = async function (context, req) {
  // Get request body
  const { prompt } = req.body;
  
  // Get environment variable for Google AI API key
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    context.res = {
      status: 500,
      body: {
        error: 'Google AI API key not configured',
        message: '请在Azure门户中配置GOOGLE_AI_API_KEY环境变量'
      }
    };
    return;
  }
  
  if (!prompt) {
    context.res = {
      status: 400,
      body: {
        error: 'Missing prompt parameter',
        message: '请提供prompt参数'
      }
    };
    return;
  }
  
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
            text: `用户说：${prompt}。请用中文回复，保持友好、自然和有趣的对话风格。回复要简洁明了，适合语音播放。`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
          topP: 0.8,
          topK: 40
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Google AI API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Google AI API');
    }
    
    const aiResponse = data.candidates[0].content.parts[0].text;
    
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
        response: aiResponse,
        timestamp: new Date().toISOString(),
        model: 'gemini-pro'
      }
    };
    
  } catch (error) {
    console.error('Error processing with Google AI:', error);
    
    context.res = {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: {
        error: '处理请求时发生错误',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}; 