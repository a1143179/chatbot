const { app } = require('@azure/functions');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Mock environment variables
process.env.GOOGLE_AI_API_KEY = 'test-api-key';

// Mock the Azure Functions context
const mockContext = {
  res: {},
  log: console.log
};

// Mock request object
const createMockRequest = (method, body, headers = {}) => ({
  method,
  body,
  headers: {
    'Content-Type': 'application/json',
    ...headers
  }
});

describe('Process Function Tests', () => {
  beforeEach(() => {
    // Reset mock context for each test
    mockContext.res = {};
  });

  test('should handle OPTIONS request for CORS with localhost', async () => {
    const req = createMockRequest('OPTIONS', null, {
      'origin': 'http://localhost:3000'
    });
    
    // Import the function
    const processFunction = require('./process/index');
    
    await processFunction(mockContext, req);
    
    expect(mockContext.res.status).toBe(200);
    expect(mockContext.res.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    expect(mockContext.res.headers['Access-Control-Allow-Methods']).toBe('POST, GET, OPTIONS');
  });

  test('should handle OPTIONS request for CORS with production domain', async () => {
    const req = createMockRequest('OPTIONS', null, {
      'origin': 'https://a1143179.github.io'
    });
    
    // Import the function
    const processFunction = require('./process/index');
    
    await processFunction(mockContext, req);
    
    expect(mockContext.res.status).toBe(200);
    expect(mockContext.res.headers['Access-Control-Allow-Origin']).toBe('https://a1143179.github.io');
    expect(mockContext.res.headers['Access-Control-Allow-Methods']).toBe('POST, GET, OPTIONS');
  });

  test('should reject non-POST requests', async () => {
    const req = createMockRequest('GET');
    
    const processFunction = require('./process/index');
    
    await processFunction(mockContext, req);
    
    expect(mockContext.res.status).toBe(405);
    expect(mockContext.res.body.error).toBe('Method not allowed');
  });

  test('should reject invalid request body', async () => {
    const req = createMockRequest('POST', null);
    
    const processFunction = require('./process/index');
    
    await processFunction(mockContext, req);
    
    expect(mockContext.res.status).toBe(400);
    expect(mockContext.res.body.error).toBe('Invalid request body');
  });

  test('should reject missing prompt', async () => {
    const req = createMockRequest('POST', {});
    
    const processFunction = require('./process/index');
    
    await processFunction(mockContext, req);
    
    expect(mockContext.res.status).toBe(400);
    expect(mockContext.res.body.error).toBe('Missing or invalid prompt parameter');
  });

  test('should reject empty prompt', async () => {
    const req = createMockRequest('POST', { prompt: '' });
    
    const processFunction = require('./process/index');
    
    await processFunction(mockContext, req);
    
    expect(mockContext.res.status).toBe(400);
    expect(mockContext.res.body.error).toBe('Missing or invalid prompt parameter');
  });
}); 