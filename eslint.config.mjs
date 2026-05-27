import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  globalIgnores(["**/out", "**/dist", "**/*.d.ts"]),
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
      ],
      curly: "warn",
      eqeqeq: "warn",
      "no-throw-literal": "warn",
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true }],
      "max-len": ["warn", { code: 120, ignoreUrls: true, ignoreStrings: true }],
      indent: ["error", 2],
    },
  },
  eslintConfigPrettier,
]);
