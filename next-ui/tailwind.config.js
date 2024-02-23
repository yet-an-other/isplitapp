import {nextui} from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui({
      themes: {
        light: {
          colors: {
            primary: {
              main: "#FFA500",
            },
            dimmed: '#a1a1aa',
          },
        },
        dark: {
          colors: {
            primary: {
              main: "#FFA500",
            },
            dimmed: '#71717a',
          },
        },
      },
    }),
  ],
}

