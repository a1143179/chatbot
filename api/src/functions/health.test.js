const healthFunction = require('./health.js');

describe('Health Function', () => {
  test('should return 200 status and health message', async () => {
    const mockRequest = {
      method: 'GET',
      url: 'http://localhost:7071/api/health'
    };

    const mockContext = {
      log: jest.fn(),
      res: {}
    };

    // Mock environment variable
    const originalEnv = process.env;
    process.env = { ...originalEnv, GOOGLE_AI_API_KEY: 'test-key' };

    await healthFunction(mockContext, mockRequest);

    expect(mockContext.res.status).toBe(200);
    expect(mockContext.res.body).toHaveProperty('status', 'healthy');
    expect(mockContext.res.body).toHaveProperty('timestamp');
    expect(mockContext.res.body).toHaveProperty('service', 'chatbot-api');
    expect(mockContext.res.body).toHaveProperty('version', '1.0.1');
    expect(mockContext.res.body).toHaveProperty('deployment', 'fixed-package-structure');
    expect(mockContext.res.body.checks.googleAI.configured).toBe(true);
    expect(mockContext.res.body.checks.googleAI.status).toBe('ready');

    // Restore process.env
    process.env = originalEnv;
  });

  test('should return 503 when API key is not configured', async () => {
    const mockRequest = {
      method: 'GET',
      url: 'http://localhost:7071/api/health'
    };

    const mockContext = {
      log: jest.fn(),
      res: {}
    };

    // Remove environment variable
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_AI_API_KEY;

    await healthFunction(mockContext, mockRequest);

    expect(mockContext.res.status).toBe(503);
    expect(mockContext.res.body.checks.googleAI.configured).toBe(false);
    expect(mockContext.res.body.checks.googleAI.status).toBe('not_configured');

    // Restore process.env
    process.env = originalEnv;
  });
}); 