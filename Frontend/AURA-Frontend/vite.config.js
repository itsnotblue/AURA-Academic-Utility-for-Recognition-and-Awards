import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "src/pages/users/dashboard.html"),
        dataprestasi: resolve(__dirname, "src/pages/users/dataprestasi.html"),
        profilprestasi: resolve(
          __dirname,
          "src/pages/users/profilprestasi.html"
        ),
        staffdashboard: resolve(__dirname, "src/pages/staff/dashboard.html"),
        staffverifikasiprestasi: resolve(
          __dirname,
          "src/pages/staff/verifikasiprestasi.html"
        ),
        staffleaderboard: resolve(
          __dirname,
          "src/pages/staff/leaderboard.html"
        ),
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    "import.meta.env.DEV_BACKEND_URL": JSON.stringify("/api/v1"),
  },
});
