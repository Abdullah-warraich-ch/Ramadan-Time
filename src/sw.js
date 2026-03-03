/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

self.addEventListener("push", (event) => {
  let payload = {
    title: "Ramadan Journey",
    body: "Time for a blessed moment.",
    url: "/",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: "/icons/icon-512.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: payload.url || "/", ...payload.data },
    actions: [
      { action: "open", title: "Open App" },
      { action: "close", title: "Dismiss" }
    ],
    tag: payload.kind || "ramadan-alert",
    renotify: true,
    silent: false
  };

  // Special handling for kind
  if (payload.kind === "sehri") {
    options.vibrate = [200, 100, 200, 100, 200];
  } else if (payload.kind === "iftar") {
    options.vibrate = [500, 100, 500];
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const targetUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Find existing client or open new one
        for (const client of clients) {
          const clientUrl = new URL(client.url).pathname;
          if (clientUrl === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return null;
      })
  );
});
