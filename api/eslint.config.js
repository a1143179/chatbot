import globals from "globals";
import jestPlugin from "eslint-plugin-jest";

export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module", // 默认使用 ESM 模块系统
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