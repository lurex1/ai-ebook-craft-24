/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Paleta GhostMe — ciemny motyw z fioletowo-niebieskim akcentem
        ghost: {
          bg: "#0B0716", // tło aplikacji
          card: "#171130", // tło kart
          cardLight: "#221A45", // jaśniejsza wersja karty (np. pola input)
          border: "#2C2354", // obramowania kart
          purple: "#8B5CF6", // główny fiolet
          blue: "#3B82F6", // główny niebieski
          text: "#F4F1FF", // tekst podstawowy
          muted: "#9D93C4", // tekst drugorzędny
          success: "#34D399", // green flagi / sukces
          danger: "#F87171", // red flagi / błędy
        },
      },
    },
  },
  plugins: [],
};
