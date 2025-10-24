import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Only include Replit plugins in development. In production (Vercel),
// devDependencies are not installed, so dynamic-import with guards avoids build failures.
export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [react()];

  if (mode !== "production") {
    try {
      const mod: any = await import("@replit/vite-plugin-runtime-error-modal");
      const runtimeErrorOverlay = (mod?.default ?? mod) as any;
      if (typeof runtimeErrorOverlay === "function") plugins.push(runtimeErrorOverlay());
    } catch {
      // ignore if not installed
    }

    if (process.env.REPL_ID !== undefined) {
      try {
        const { cartographer } = await import("@replit/vite-plugin-cartographer");
        if (typeof cartographer === "function") plugins.push(cartographer());
      } catch {
        // ignore if not installed
      }
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    envDir: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      target: "es2017", // Ensures compatibility with older Android WebViews
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
