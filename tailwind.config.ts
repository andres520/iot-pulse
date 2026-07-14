import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0b1220",
        card: "#111a2e",
        edge: "#1e2a44",
        accent: "#38bdf8",
      },
    },
  },
  plugins: [],
};
export default config;
