import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const probe = await fetch("/sw.js", { method: "HEAD", cache: "no-store" });
      const contentType = (probe.headers.get("content-type") || "").toLowerCase();
      if (!probe.ok || contentType.includes("text/html")) {
        console.warn("SW not available at /sw.js. Skipping registration.");
        return;
      }
      await navigator.serviceWorker.register("/sw.js");
    } catch (error) {
      console.error("SW registration failed:", error);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
