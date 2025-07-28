module.exports = async function (context, req) {
  // 获取请求体
  const { message, userId } = req.body;
  
  // 获取环境变量
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  try {
    // 调用Google AI Studio API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `用户说：${message}。请用中文回复，保持友好和自然的对话风格。`
          }]
        }]
      })
    });
    
    const data = await response.json();
    
    // 返回响应
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
        error: '处理请求时发生错误',
        message: error.message
      }
    };
  }
}; 