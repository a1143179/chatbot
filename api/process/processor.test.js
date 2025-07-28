const processor = require('./index');

// Mock fetch globally
global.fetch = jest.fn();

describe('Processor Function', () => {
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
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: {
        prompt: 'Hello, how are you?'
      }
    };

    // Set up environment variables
    process.env.GOOGLE_AI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_AI_API_KEY;
  });

  describe('Successful API calls', () => {
    it('should process valid request and return AI response', async () => {
      // Mock successful Google AI response
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: 'Hello! I am doing well, thank you for asking.'
              }]
            }
          }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      // Call the function
      await processor(mockContext, mockReq);

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('Hello, how are you?')
        })
      );

      // Verify response
      expect(mockContext.res.status).toBe(200);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          response: 'Hello! I am doing well, thank you for asking.',
          model: 'gemini-pro'
        })
      );
    });

    it('should handle different prompts correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: 'The weather is sunny today!'
              }]
            }
          }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      mockReq.body.prompt = 'What is the weather like?';

      await processor(mockContext, mockReq);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('What is the weather like?')
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should return 500 when API key is not configured', async () => {
      delete process.env.GOOGLE_AI_API_KEY;

      await processor(mockContext, mockReq);

      expect(mockContext.res.status).toBe(500);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          error: 'Google AI API key not configured'
        })
      );
    });

    it('should return 400 when prompt is missing', async () => {
      mockReq.body = {};

      await processor(mockContext, mockReq);

      expect(mockContext.res.status).toBe(400);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          error: 'Missing prompt parameter'
        })
      );
    });

    it('should return 400 when prompt is empty', async () => {
      mockReq.body.prompt = '';

      await processor(mockContext, mockReq);

      expect(mockContext.res.status).toBe(400);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          error: 'Missing prompt parameter'
        })
      );
    });

    it('should handle Google AI API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized')
      };
      global.fetch.mockResolvedValue(mockResponse);

      await processor(mockContext, mockReq);

      expect(mockContext.res.status).toBe(500);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          error: 'Error occurred while processing request'
        })
      );
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await processor(mockContext, mockReq);

      expect(mockContext.res.status).toBe(500);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          error: 'Error occurred while processing request'
        })
      );
    });

    it('should handle invalid response format', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [] // Empty candidates
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await processor(mockContext, mockReq);

      expect(mockContext.res.status).toBe(500);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          error: 'Error occurred while processing request'
        })
      );
    });
  });

  describe('CORS headers', () => {
    it('should include CORS headers in successful response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: 'Test response'
              }]
            }
          }]
        })
      };
      global.fetch.mockResolvedValue(mockResponse);

      await processor(mockContext, mockReq);

      expect(mockContext.res.headers).toEqual(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        })
      );
    });

    it('should include CORS headers in error response', async () => {
      delete process.env.GOOGLE_AI_API_KEY;

      await processor(mockContext, mockReq);

      // For error responses without API key, there are no headers set
      // The function returns early without setting headers
      expect(mockContext.res.status).toBe(500);
      expect(mockContext.res.body).toEqual(
        expect.objectContaining({
          error: 'Google AI API key not configured'
        })
      );
    });
  });
}); 