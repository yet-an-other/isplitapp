import {nextui, colors} from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default { 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: { 
    },
  },
  darkMode: "class",
  plugins: [nextui({
      themes: {      
        light: {
          colors: {
            dimmed: '#a1a1aa',
            normal: '#2e3330',
            primary: {
              '50': '#f3f6f4',
              '100': '#e1eae3',
              '200': '#c4d4ca',
              '300': '#9eb7a8',
              '400': '#759582',
              '500': '#5a816c',
              '600': '#3d5c4c',
              '700': '#32493d',
              '800': '#293d34',
              '900': '#21312a',
              '950': '#131b17',
              DEFAULT: '#5a816c',
            },
            focus: {
              DEFAULT: '#5a816c',
            },
            danger: {
              '50': '#fff2f1',
              '100': '#ffe3e1',
              '200': '#ffcbc7',
              '300': '#ffa7a1',
              '400': '#ff746a',
              '500': '#f73426',
              '600': '#e52a1d',
              '700': '#c12014',
              '800': '#9f1e15',
              '900': '#841f18',
              '950': '#480b07',
              DEFAULT: '#f73426',
            },
          },
        },
        dark: {
          colors: {
            dimmed: '#71717a',
            normal: '#e2e4e3',
            primary: {
                '50': '#131b17',
                '100': '#21312a',
                '200': '#293d34',
                '300': '#32493d',
                '400': '#3d5c4c',
                '500': '#5a816c',
                '600': '#759582',
                '700': '#9eb7a8',
                '800': '#c4d4ca',
                '900': '#e1eae3',
                '950': '#f3f6f4',
                DEFAULT: '#5a816c',
            },
            focus: {
                DEFAULT: '#5a816c',
            },
            danger: {
                '950': '#fff2f1',
                '900': '#ffe3e1',
                '800': '#ffcbc7',
                '700': '#ffa7a1',
                '600': '#ff746a',
                '500': '#f73426',
                '400': '#e52a1d',
                '300': '#c12014',
                '200': '#9f1e15',
                '100': '#841f18',
                '50': '#480b07',
                DEFAULT: '#f73426',
            },
          },
        },

      },
    }),
  ],
}

