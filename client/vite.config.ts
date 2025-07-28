import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

/// <reference types="vite/client" />

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer để xem kích thước files
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: "dist/stats.html",
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
    // Gzip compression
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      deleteOriginFile: false,
    }),
    // Brotli compression (tốt hơn gzip)
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      deleteOriginFile: false,
    }),
  ],
  build: {
    // Tối ưu chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách vendor chunks
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          socket: ["socket.io-client"],
          utils: ["axios", "react-hot-toast"],
        },
      },
    },
    // Nén CSS và JS - sử dụng esbuild (nhanh hơn terser)
    minify: "esbuild",
    // Tối ưu CSS
    cssMinify: "esbuild",
    cssCodeSplit: true, // Enable CSS code splitting
    // Tăng chunk size warning
    chunkSizeWarningLimit: 1000,
    // Enable source maps cho production debugging (optional)
    sourcemap: false,
    // bfcache optimizations
    target: "esnext", // Modern browsers for better bfcache support
  },
  // Optimizations
  esbuild: {
    // Loại bỏ console và debugger
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
});
