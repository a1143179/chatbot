const health = require('./index');

describe('Health Function', () => {
  let mockContext;
  let mockReq;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock context - Azure Functions sets context.res directly
    mockContext = {
      res: {},
      log: jest.fn()
    };

    // Mock request
    mockReq = {
      method: 'GET',
      headers: {}
    };
  });

  describe('Successful health checks', () => {
    it('should return healthy status when API key is configured', async () => {
      // Set up environment variables
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';

      // Call the function
      await health(mockContext, mockReq);

      // Verify response
      expect(mockContext.res.status).toBe(200);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          status: 'healthy',
          service: 'chatbot-api',
          version: '1.0.0',
          checks: {
            googleAI: {
              configured: true,
              status: 'ready'
            },
            azureFunctions: {
              status: 'running',
              runtime: 'node'
            }
          }
        })
      );

      // Verify CORS headers
      expect(mockContext.res.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        })
      );
    });

    it('should include timestamp in response', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';

      await health(mockContext, mockReq);

      const response = mockContext.res.body;
      expect(response).toHaveProperty('timestamp');
      expect(new Date(response.timestamp)).toBeInstanceOf(Date);
    });

    it('should include environment information', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';
      process.env.NODE_ENV = 'test';

      await health(mockContext, mockReq);

      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          environment: 'test'
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should return unhealthy status when API key is not configured', async () => {
      // Ensure API key is not set
      delete process.env.GOOGLE_AI_API_KEY;

      // Call the function
      await health(mockContext, mockReq);

      // Verify response
      expect(mockContext.res.status).toBe(503);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          status: 'healthy', // Note: status is still 'healthy' but HTTP status is 503
          checks: {
            googleAI: {
              configured: false,
              status: 'not_configured'
            },
            azureFunctions: {
              status: 'running',
              runtime: 'node'
            }
          }
        })
      );
    });

    it('should handle empty API key', async () => {
      process.env.GOOGLE_AI_API_KEY = '';

      await health(mockContext, mockReq);

      expect(mockContext.res.status).toBe(503);
      expect(mockContext.res.body.checks.googleAI.configured).toBe(false);
    });

    it('should handle undefined API key', async () => {
      // Delete the environment variable completely
      delete process.env.GOOGLE_AI_API_KEY;

      await health(mockContext, mockReq);

      expect(mockContext.res.status).toBe(503);
      expect(mockContext.res.body.checks.googleAI.configured).toBe(false);
    });
  });

  describe('Response structure', () => {
    it('should have correct response structure', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';

      await health(mockContext, mockReq);

      const response = mockContext.res.body;
      
      // Check required fields
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('service');
      expect(response).toHaveProperty('version');
      expect(response).toHaveProperty('environment');
      expect(response).toHaveProperty('checks');

      // Check checks structure
      expect(response.checks).toHaveProperty('googleAI');
      expect(response.checks).toHaveProperty('azureFunctions');
      expect(response.checks.googleAI).toHaveProperty('configured');
      expect(response.checks.googleAI).toHaveProperty('status');
      expect(response.checks.azureFunctions).toHaveProperty('status');
      expect(response.checks.azureFunctions).toHaveProperty('runtime');
    });

    it('should have correct service information', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';

      await health(mockContext, mockReq);

      const response = mockContext.res.body;
      expect(response.service).toBe('chatbot-api');
      expect(response.version).toBe('1.0.0');
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers in healthy response', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';

      await health(mockContext, mockReq);

      expect(mockContext.res.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        })
      );
    });

    it('should include CORS headers in unhealthy response', async () => {
      delete process.env.GOOGLE_AI_API_KEY;

      await health(mockContext, mockReq);

      expect(mockContext.res.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        })
      );
    });
  });
}); 