import "dotenv/config";
import { randomUUID } from "node:crypto";
import cors from "cors";
import cron from "node-cron";
import express from "express";
import webPush from "web-push";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error("Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY in environment variables");
}

webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

const subscriptions = new Map();
const scheduledTasks = [];

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/push/public-key", (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post("/api/push/subscribe", (req, res) => {
  const { userId, subscription } = req.body || {};
  if (!userId || !subscription?.endpoint) {
    return res.status(400).json({ error: "userId and valid subscription are required" });
  }

  subscriptions.set(userId, subscription);
  return res.status(201).json({ success: true });
});

app.post("/api/push/schedule", (req, res) => {
  const { userId, title, body, scheduleAt, data } = req.body || {};
  if (!userId || !title || !body || !scheduleAt) {
    return res.status(400).json({ error: "userId, title, body, scheduleAt are required" });
  }
  if (!subscriptions.has(userId)) {
    return res.status(404).json({ error: "No subscription found for user" });
  }

  const when = new Date(scheduleAt);
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    return res.status(400).json({ error: "scheduleAt must be a valid future date" });
  }

  const task = {
    id: randomUUID(),
    userId,
    title,
    body,
    data: data || { url: "/" },
    scheduleAt: when.toISOString(),
    sent: false,
  };

  scheduledTasks.push(task);
  return res.status(201).json({ success: true, taskId: task.id, scheduleAt: task.scheduleAt });
});

cron.schedule("* * * * *", async () => {
  const now = Date.now();
  const dueTasks = scheduledTasks.filter((task) => !task.sent && new Date(task.scheduleAt).getTime() <= now);

  for (const task of dueTasks) {
    const subscription = subscriptions.get(task.userId);
    if (!subscription) {
      task.sent = true;
      continue;
    }

    try {
      const payload = JSON.stringify({
        title: task.title,
        body: task.body,
        url: task.data?.url || "/",
        data: task.data,
      });
      await webPush.sendNotification(subscription, payload);
      task.sent = true;
    } catch (error) {
      console.error("Push send error:", error?.message || error);
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        subscriptions.delete(task.userId);
        task.sent = true;
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Push scheduler server running on http://localhost:${PORT}`);
});
