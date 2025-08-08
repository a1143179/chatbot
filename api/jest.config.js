export default {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: ['@babel/preset-env'] }]
  },
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageReporters: ['text', 'lcov', 'html']
};