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
     
      colors: {
        'stack': {
          '50': '#f7f8f8',
          '100': '#e2e4e3',
          '200': '#c4cac6',
          '300': '#9fa8a3',
          '400': '#84908a',
          '500': '#606c67',
          '600': '#4c5752',
          '700': '#3e4743',
          '800': '#353b39',
          '900': '#2e3330',
          '950': '#181b1a',
        },      
        'limed-spruce': {
          '50': '#f4f7f7',
          '100': '#e3e9ea',
          '200': '#c9d5d8',
          '300': '#a4b7bc',
          '400': '#779299',
          '500': '#5c777e',
          '600': '#4f646b',
          '700': '#44535a',
          '800': '#3d484d',
          '900': '#363e43',
          '950': '#21272b',
        },
      },
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
            }

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
            }            
          },
        },

      },
    }),
  ],
}

