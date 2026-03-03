const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function fetchPublicVapidKey() {
  const res = await fetch(`${API_BASE}/api/push/public-key`);
  if (!res.ok) {
    throw new Error("Failed to load VAPID public key");
  }
  const json = await res.json();
  return json.publicKey;
}

export async function subscribeUser(userId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push not supported in this browser");
  }

  const registration = await navigator.serviceWorker.ready;
  const publicKey = await fetchPublicVapidKey();
  const existing = await registration.pushManager.getSubscription();

  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const res = await fetch(`${API_BASE}/api/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, subscription }),
  });

  if (!res.ok) {
    throw new Error("Failed to store subscription on server");
  }

  return subscription;
}

export async function scheduleNotification({ userId, title, body, scheduleAt, data }) {
  const res = await fetch(`${API_BASE}/api/push/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title, body, scheduleAt, data }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Failed to schedule push notification");
  }

  return res.json();
}
