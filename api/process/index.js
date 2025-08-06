const fetch = require('node-fetch');

module.exports = async function (context, req) {
    console.log('Process function called with method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    // Let Azure Functions handle CORS globally via host.json configuration
    
    // Let Azure Functions handle CORS preflight requests globally
    // Remove explicit OPTIONS handling to avoid conflicts
    
    // Validate request method
    if (req.method !== 'POST') {
        console.log('Invalid method:', req.method);
        context.res = {
            status: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
            },
            body: {
                error: 'Method not allowed',
                message: 'Only POST method is supported'
            }
        };
        return;
    }
    
    // Get request body
    const body = req.body;
    console.log('Request body type:', typeof body);
    console.log('Request body:', body);
    
    // Validate request body
    if (!body || typeof body !== 'object') {
        console.log('Invalid request body:', body);
        context.res = {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
            },
            body: {
                error: 'Invalid request body',
                message: 'Request body must be a JSON object'
            }
        };
        return;
    }
    
    const { prompt, chatHistory = [], language = 'english' } = body;
    console.log('Extracted prompt:', prompt);
    console.log('Chat history length:', chatHistory.length);
    console.log('Language preference:', language);
    
    // Get environment variable for Google AI API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    console.log('API key configured:', !!apiKey);
    
    if (!apiKey) {
        console.log('Google AI API key not configured');
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
            },
            body: {
                error: 'Google AI API key not configured',
                message: 'Please configure GOOGLE_AI_API_KEY environment variable in Azure portal'
            }
        };
        return;
    }
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        console.log('Missing or invalid prompt:', prompt);
        context.res = {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
            },
            body: {
                error: 'Missing or invalid prompt parameter',
                message: 'Please provide a valid prompt parameter as a string'
            }
        };
        return;
    }
    
    try {
        console.log('Calling Google AI API with prompt:', prompt);
        
        // Build conversation history for context
        const contents = [];
        
        // Add conversation history if provided
        if (chatHistory && chatHistory.length > 0) {
            chatHistory.forEach(message => {
                contents.push({
                    role: message.role === 'user' ? 'user' : 'model',
                    parts: [{ text: message.content }]
                });
            });
        }
        
        // Add current user message
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });
        
        console.log('Sending conversation with', contents.length, 'messages to Google AI');
        
        // Create system instruction based on language preference
        const systemInstruction = language === 'chinese' 
            ? "你是一个友好的AI助手。请始终用中文回复用户的问题。保持友好、自然和有趣的对话风格。回复要简洁，适合语音播放。"
            : "You are a friendly AI assistant. Please always respond in English to user questions. Maintain a friendly, natural, and interesting conversation style. Keep responses concise and suitable for voice playback.";
        
        // Call Google AI Studio API
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150,
                    topP: 0.8,
                    topK: 40
                },
                tools: [
                    {
                        functionDeclarations: [
                            {
                                name: "get_weather",
                                description: "Get real-time weather information for a specific location",
                                parameters: {
                                    type: "OBJECT",
                                    properties: {
                                        location: {
                                            type: "STRING",
                                            description: "City name or location (e.g., 'Beijing', 'New York', 'Tokyo')"
                                        }
                                    },
                                    required: ["location"]
                                }
                            }
                        ]
                    }
                ]
            })
        });
        
        console.log('Google AI API response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.log('Google AI API error response:', errorData);
            throw new Error(`Google AI API error: ${response.status} - ${errorData}`);
        }
        
        const data = await response.json();
        console.log('Google AI API response data:', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from Google AI API');
        }
        
        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('AI response:', aiResponse);
        
        // Check if AI wants to call weather function
        if (data.candidates[0].content.parts[0].functionCall) {
            const functionCall = data.candidates[0].content.parts[0].functionCall;
            if (functionCall.name === 'get_weather') {
                const args = functionCall.args;
                const location = args.location;
                
                console.log('Weather function called for location:', location);
                
                // Call weather API (you'll need to add your weather API key)
                const weatherApiKey = process.env.WEATHER_API_KEY;
                if (weatherApiKey) {
                    try {
                        const weatherResponse = await fetch(
                            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${weatherApiKey}&units=metric&lang=${language === 'chinese' ? 'zh_cn' : 'en'}`
                        );
                        
                        if (weatherResponse.ok) {
                            const weatherData = await weatherResponse.json();
                            const weatherInfo = language === 'chinese' 
                                ? `${location}的天气：温度${weatherData.main.temp}°C，${weatherData.weather[0].description}，湿度${weatherData.main.humidity}%`
                                : `Weather in ${location}: ${weatherData.main.temp}°C, ${weatherData.weather[0].description}, humidity ${weatherData.main.humidity}%`;
                            
                            console.log('Weather info:', weatherInfo);
                            
                            context.res = {
                                status: 200,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
                                },
                                body: {
                                    response: weatherInfo,
                                    timestamp: new Date().toISOString(),
                                    model: 'gemini-pro',
                                    weatherData: weatherData
                                }
                            };
                            return;
                        }
                    } catch (weatherError) {
                        console.error('Weather API error:', weatherError);
                    }
                }
            }
        }
        
        // Return response
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Origin, Accept'
            },
            body: {
                error: 'Error occurred while processing request',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}; 