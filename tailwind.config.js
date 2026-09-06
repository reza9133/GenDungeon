/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14181c",
          soft: "#1c2128",
          rule: "#2a2f37",
        },
        parchment: {
          DEFAULT: "#ebe3d0",
          dim: "#d9cdb0",
          shadow: "#c7b997",
        },
        candle: {
          DEFAULT: "#c98a3c",
          bright: "#e0a55c",
          dim: "#8f6329",
        },
        seal: {
          DEFAULT: "#8c3b32",
          bright: "#a8493e",
        },
        moss: {
          DEFAULT: "#5c7a5e",
          bright: "#729875",
        },
        iron: "#4a4640",
      },
      fontFamily: {
        display: ["Spectral", "Georgia", "serif"],
        body: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "ink-vignette":
          "radial-gradient(ellipse at top, #1c2128 0%, #14181c 60%, #0e1115 100%)",
      },
      boxShadow: {
        page: "0 1px 0 rgba(235,227,208,0.6), 0 30px 60px -20px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
