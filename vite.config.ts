import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  optimizeDeps: {
    include: ["@excalidraw/excalidraw"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
    "process.env.IS_PREACT": JSON.stringify("false"),
    "global": "window",
  },
  build: {
    // Raise chunk size warning to 1500kb for production safety
    chunkSizeWarningLimit: 1500,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Vendor: Excalidraw (heaviest — ~2MB) ──────────────────
          if (id.includes("@excalidraw")) return "vendor-excalidraw";

          // ── Vendor: Recharts + d3 ─────────────────────────────────
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-"))
            return "vendor-charts";

          // ── Vendor: Supabase ─────────────────────────────────────
          if (id.includes("@supabase")) return "vendor-supabase";

          // ── Vendor: TanStack Query ───────────────────────────────
          if (id.includes("@tanstack")) return "vendor-query";

          // ── Vendor: Phone input ──────────────────────────────────
          if (id.includes("react-international-phone")) return "vendor-phone";

          // ── Vendor: date-fns ─────────────────────────────────────
          if (id.includes("date-fns")) return "vendor-datefns";

          // ── Vendor: Radix UI (shared across app) ─────────────────
          if (id.includes("@radix-ui")) return "vendor-radix";

          // ── Vendor: Lucide icons ─────────────────────────────────
          if (id.includes("lucide-react")) return "vendor-icons";
        },
      },
    },
  },
}));
