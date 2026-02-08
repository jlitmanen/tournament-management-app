import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to the Express backend
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // Proxy Auth routes to the Express backend
      "/login": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/logout": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/signup": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
