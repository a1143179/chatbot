module.exports = async function (context, req) {
  // Get request body
  const { audioData, language = 'zh-CN' } = req.body;
  
  // Get environment variable
  const speechKey = process.env.SPEECH_API_KEY;
  const speechRegion = process.env.SPEECH_REGION || 'eastasia';
  
  try {
    // Here you can integrate Azure Speech Services or other speech APIs
    // Example: Call Azure Speech-to-Text
    const response = await fetch(`https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'audio/wav'
      },
      body: audioData
    });
    
    const data = await response.json();
    
    // Return response
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
        error: 'Error occurred during speech processing',
        message: error.message
      }
    };
  }
}; 