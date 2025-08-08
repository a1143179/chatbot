import globals from "globals";
import jestPlugin from "eslint-plugin-jest";

export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
    },
  },
  {
    files: ["__tests__/**/*.js"],
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      ...jestPlugin.configs["recommended"].rules,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];