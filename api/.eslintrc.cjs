module.exports = {
  env: {
    node: true
  },
  overrides: [
    {
      files: ["**/__tests__/**/*.js", "**/*.test.js"],
  // env: { jest: true } 移除，采用 plugin:jest/recommended 自动识别
  plugins: ['jest'],
  extends: ['plugin:jest/recommended'],
    }
  ]
};
