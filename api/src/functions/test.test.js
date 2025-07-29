const testFunction = require('./test.js');

describe('Test Function', () => {
  test('should return 200 status and test message', async () => {
    const mockRequest = {
      method: 'GET',
      url: 'http://localhost:7071/api/test'
    };

    const mockContext = {
      log: jest.fn(),
      res: {}
    };

    await testFunction(mockContext, mockRequest);

    expect(mockContext.res.status).toBe(200);
    expect(mockContext.res.body).toHaveProperty('message', 'Azure Functions is working!');
    expect(mockContext.res.body).toHaveProperty('timestamp');
    expect(mockContext.res.body).toHaveProperty('environment');
    expect(mockContext.res.body).toHaveProperty('deployment', 'test-verification');
  });
}); 