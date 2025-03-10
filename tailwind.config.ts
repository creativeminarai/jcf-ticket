import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        "coffee-drop": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0" },
          "10%": { transform: "translateY(20%) scale(1)", opacity: "0.8" },
          "50%": { transform: "translateY(150%) scale(1)", opacity: "0.9" },
          "70%": { transform: "translateY(300%) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(500%) scale(1.1)", opacity: "0" }
        },
        "coffee-ripple": {
          "0%": { transform: "scale(0)", opacity: "0.8" },
          "50%": { transform: "scale(1.5)", opacity: "0.5" },
          "100%": { transform: "scale(3)", opacity: "0" }
        },
        "fade-in-out": {
          "0%": { opacity: "0" },
          "25%": { opacity: "0.7" },
          "75%": { opacity: "0.7" },
          "100%": { opacity: "0" }
        }
      },
      animation: {
        "coffee-drop": "coffee-drop var(--drop-duration, 2s) ease-in forwards",
        "coffee-ripple": "coffee-ripple 0.6s ease-out forwards",
        "fade-in-out": "fade-in-out 3s ease-in-out forwards"
      }
    },
  },
  plugins: [],
} satisfies Config;
