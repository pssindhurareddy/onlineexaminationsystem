/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0F1E",
        surface: "#1F2937",
        card: "#111827",
        accent: {
          DEFAULT: "#00C2FF",
          foreground: "#ffffff"
        },
        secondary: {
          DEFAULT: "#7C3AED",
          foreground: "#ffffff"
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        border: "#374151"
      },
      fontFamily: {
        heading: ["Outfit", "sans-serif"],
        body: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
