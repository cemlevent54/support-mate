import js from "@eslint/js";
import globals from "globals";

export default [
  { 
    files: ["**/*.{js,mjs,cjs}"], 
    plugins: { js }, 
    extends: ["js/recommended"] 
  },
  { 
    files: ["**/*.js"], 
    languageOptions: { 
      sourceType: "module",
      ecmaVersion: 2022,
      globals: globals.node 
    } 
  },
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off"
    }
  }
];
