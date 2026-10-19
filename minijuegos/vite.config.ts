import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("gsap") || id.includes("swiper") || id.includes("canvas-confetti")) {
              return "vendor-anim";
            }
            if (id.includes("howler")) {
              return "vendor-audio";
            }
            return "vendor";
          }
          if (id.includes("data/songs.ts")) {
            return "bell-songs-data";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
