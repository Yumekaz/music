import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Reverb",
        short_name: "Reverb",
        description: "Music that echoes your taste.",
        theme_color: "#0b0f0d",
        background_color: "#080b0a",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "artwork-images",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 7 * 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-metadata",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 24 * 60 * 60
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000"
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.js"]
  }
});
