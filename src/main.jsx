import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Register the SW managed by vite-plugin-pwa
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      console.log("SW registered:", registration.scope);
      // Optional: Handle updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // New content is available; please refresh.
                console.log("New content available, please refresh.");
              }
            }
          };
        }
      };
    }).catch((error) => {
      console.error("SW registration failed:", error);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
