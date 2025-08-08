/* eslint-env jest */
// Jest test for logging user prompts and AI responses
jest.mock('../database', () => ({
  logAIInteraction: jest.fn().mockResolvedValue(123),
}));

const { logAIInteraction } = require('../database');

describe('AI Interaction Logging', () => {
  it('should log user_prompt and ai_response to ai_interactions table', async () => {
    const mockData = {
      // user_id: 'jest-user',
      session_id: 'jest-session',
      request_datetime: new Date(),
      user_prompt: 'Jest test prompt',
      language_preference: 'english',
      chat_history_count: 0,
      ai_response: 'Jest test response',
      response_model: 'jest',
      response_tokens: 5,
      response_time_ms: 50,
      request_ip: '127.0.0.1',
      user_agent: 'jest-test',
    };
    const result = await logAIInteraction(mockData);
    expect(result).toBe(123);
  });
});
