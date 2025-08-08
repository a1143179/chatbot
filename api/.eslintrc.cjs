module.exports = {
  env: {
    node: true
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.js", "**/*.test.js"],
      env: {
        jest: true
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    }
  ]
};
