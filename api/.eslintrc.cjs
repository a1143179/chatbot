module.exports = {
  env: {
    node: true
  },
  overrides: [
    {
      files: ["**/__tests__/*.js", "*.test.js"],
      env: {
        jest: true
      }
    }
  ]
};
