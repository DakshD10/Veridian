import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter"],
        mono: ["JetBrains Mono"],
      },
      animation: {
        shimmer: "shimmer 1.5s ease-in-out infinite",
        regressionPulse: "regressionPulse 3s ease-in-out infinite",
        watchPulse: "watchPulse 2s ease-out infinite",
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;