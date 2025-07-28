// Mock the app.http to capture the handler
const mockApp = {
  http: jest.fn()
};

// Mock the @azure/functions module
jest.mock('@azure/functions', () => ({
  app: mockApp
}));

// Import the test function to trigger the registration
require('./test');

describe('Test Function', () => {
  let testHandler;

  beforeEach(() => {
    // Find the test function registration
    const testCall = mockApp.http.mock.calls.find(call => call[0] === 'test');
    if (testCall) {
      testHandler = testCall[1].handler;
    }
  });

  test('should return 200 status and test message', async () => {
    if (!testHandler) {
      throw new Error('Test handler not found');
    }

    const mockRequest = {
      method: 'GET',
      url: 'http://localhost:7071/api/test'
    };

    const mockContext = {
      log: jest.fn()
    };

    const response = await testHandler(mockRequest, mockContext);

    expect(response.status).toBe(200);
    expect(response.jsonBody).toHaveProperty('message', 'Azure Functions is working!');
    expect(response.jsonBody).toHaveProperty('timestamp');
    expect(response.jsonBody).toHaveProperty('environment');
    expect(response.jsonBody).toHaveProperty('deployment', 'test-verification');
  });
}); 