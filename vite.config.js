import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react(), tailwindcss()];

  try {
    const { VitePWA } = await import("vite-plugin-pwa");
    plugins.push(
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.js",
        manifest: false,
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
        },
      })
    );
  } catch {
    // Allow app to run without PWA plugin installed.
  }

  return { plugins };
});
