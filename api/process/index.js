const fetch = require('node-fetch');

module.exports = async function (context, req) {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            body: {}
        };
        return;
    }
    
    // Get request body
    const body = req.body;
    const { prompt } = body;
    
    // Get environment variable for Google AI API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
        context.res = {
            status: 500,
            body: {
                error: 'Google AI API key not configured',
                message: 'Please configure GOOGLE_AI_API_KEY environment variable in Azure portal'
            }
        };
        return;
    }
    
    if (!prompt) {
        context.res = {
            status: 400,
            body: {
                error: 'Missing prompt parameter',
                message: 'Please provide a prompt parameter'
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
                        text: `User says: ${prompt}. Please respond in Chinese, maintaining a friendly, natural, and interesting conversation style. Keep the response concise and suitable for voice playback.`
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
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
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
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            body: {
                error: 'Error occurred while processing request',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}; 