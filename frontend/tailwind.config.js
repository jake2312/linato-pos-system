import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#111827",
        linen: "#f6f3ee",
        basil: "#0f766e",
        mango: "#f59e0b",
        rose: "#e11d48",
      },
      boxShadow: {
        card: "0 12px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [forms],
}
