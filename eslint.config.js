import "@rushstack/eslint-patch/modern-module-resolution.js";
import next from "eslint-config-next";

export default [
  ...next,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
