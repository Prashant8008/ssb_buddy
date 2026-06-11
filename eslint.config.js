import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", ".venv", "backend", "tailwind.config.js", "postcss.config.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended
);
