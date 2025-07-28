const { app } = require('@azure/functions');

// Mock the app.http to capture the handler
const mockApp = {
  http: jest.fn()
};

// Mock the @azure/functions module
jest.mock('@azure/functions', () => ({
  app: mockApp
}));

// Import the health function to trigger the registration
require('./health');

describe('Health Function', () => {
  let healthHandler;

  beforeEach(() => {
    // Get the registered handler
    expect(mockApp.http).toHaveBeenCalledWith('health', expect.any(Object));
    const callArgs = mockApp.http.mock.calls[0];
    healthHandler = callArgs[1].handler;
  });

  test('should return 200 status and health message', async () => {
    const mockRequest = {
      method: 'GET',
      url: 'http://localhost:7071/api/health'
    };

    const mockContext = {
      log: jest.fn()
    };

    // Mock environment variable
    process.env.GOOGLE_AI_API_KEY = 'test-key';

    const response = await healthHandler(mockRequest, mockContext);

    expect(response.status).toBe(200);
    expect(response.jsonBody).toHaveProperty('status', 'healthy');
    expect(response.jsonBody).toHaveProperty('timestamp');
    expect(response.jsonBody).toHaveProperty('service', 'chatbot-api');
    expect(response.jsonBody).toHaveProperty('version', '1.0.0');
    expect(response.jsonBody.checks.googleAI.configured).toBe(true);
    expect(response.jsonBody.checks.googleAI.status).toBe('ready');
  });

  test('should return 503 when API key is not configured', async () => {
    const mockRequest = {
      method: 'GET',
      url: 'http://localhost:7071/api/health'
    };

    const mockContext = {
      log: jest.fn()
    };

    // Remove environment variable
    delete process.env.GOOGLE_AI_API_KEY;

    const response = await healthHandler(mockRequest, mockContext);

    expect(response.status).toBe(503);
    expect(response.jsonBody.checks.googleAI.configured).toBe(false);
    expect(response.jsonBody.checks.googleAI.status).toBe('not_configured');
  });
}); 