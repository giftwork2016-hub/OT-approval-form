import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter var'", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#f3f5ff",
          100: "#e6ebff",
          200: "#c5ceff",
          300: "#9faaff",
          400: "#7380ff",
          500: "#4b5aff",
          600: "#3141e6",
          700: "#2532b4",
          800: "#1c2686",
          900: "#121a59",
        },
        accent: {
          100: "#ffe7f2",
          200: "#ffc4e2",
          300: "#ff9ad0",
          400: "#ff6fbd",
          500: "#ff46af",
          600: "#db2391",
          700: "#a81b6e",
          800: "#76134c",
          900: "#440a2b",
        },
        success: "#3CCB7F",
        warning: "#FFB347",
        danger: "#FF4D4F",
        surface: {
          50: "#f9fbff",
          100: "#f2f6ff",
          200: "#e6edff",
          300: "#d5dfff",
        },
      },
      boxShadow: {
        floating: "0px 12px 30px rgba(79, 114, 255, 0.15)",
      },
      borderRadius: {
        xl: "1.25rem",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
