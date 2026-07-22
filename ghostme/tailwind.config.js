/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Paleta GhostTalk "grape soda" — śliwkowa noc z cukierkowym różem i fioletem
        ghost: {
          bg: "#1B0B2E", // tło aplikacji
          card: "#2A1445", // tło kart
          cardLight: "#3A1D5E", // jaśniejsza wersja karty (np. pola input)
          border: "#4A2A75", // obramowania kart
          pink: "#FF2D8D", // główny róż (akcent)
          purple: "#A855F7", // główny fiolet
          text: "#FDF4FF", // tekst podstawowy
          muted: "#C9A8E8", // tekst drugorzędny
          success: "#6EE7B7", // green flagi / sukces (miętowy)
          danger: "#FB7185", // red flagi / błędy (koralowy)
        },
      },
    },
  },
  plugins: [],
};
