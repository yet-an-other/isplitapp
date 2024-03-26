import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
//
export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      manifest: false,
      strategies: 'injectManifest',
      srcDir: 'src/utils',
      filename: 'serviceWorker.ts',


      // add this to cache all the imports
      //
      workbox: {
          globPatterns: ["**/*"],
      },

      // add this to cache all the
      // static assets in the public folder
      //
      includeAssets: [
          "**/*",
      ],      
    })
  ],
  server: {
    host: '0.0.0.0',
    open: '/',
  },
})


