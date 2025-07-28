module.exports = async function (context, req) {
  // 获取请求体
  const { audioData, language = 'zh-CN' } = req.body;
  
  // 获取环境变量
  const speechKey = process.env.SPEECH_API_KEY;
  const speechRegion = process.env.SPEECH_REGION || 'eastasia';
  
  try {
    // 这里可以集成Azure Speech Services或其他语音API
    // 示例：调用Azure Speech-to-Text
    const response = await fetch(`https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'audio/wav'
      },
      body: audioData
    });
    
    const data = await response.json();
    
    // 返回响应
    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: {
        text: data.DisplayText || data.Text,
        confidence: data.Confidence,
        language: language
      }
    };
  } catch (error) {
    context.res = {
      status: 500,
      body: {
        error: '语音处理时发生错误',
        message: error.message
      }
    };
  }
}; 