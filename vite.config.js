import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  build: {
    target: "esnext",
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["hls.js"],
          "media-player": [
            "./src/js/components/MediaPlayer.js",
            "./src/js/components/MediaDetails.js",
          ],
          "media-grid": [
            "./src/js/components/MediaGrid.js",
            "./src/js/components/MediaCard.js",
          ],
          "ui-components": [
            "./src/js/components/BitcoinPopup.js",
            "./src/js/components/ShareModal.js",
            "./src/js/components/EpisodeModal.js",
          ],
        },
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split(".").at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = "img";
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
      },
    },
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    emptyOutDir: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
  css: {
    devSourcemap: true,
    modules: {
      scopeBehaviour: "local",
    },
  },
  optimizeDeps: {
    include: ["hls.js"],
    exclude: [],
  },
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/js/components",
      "@utils": "/src/js/utils",
      "@api": "/src/js/api",
      "@styles": "/src/styles",
      "@assets": "/src/assets",
    },
  },
  preview: {
    port: 3000,
    open: true,
  },
});
