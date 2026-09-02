import {
  getAllSubscriptions,
  removeSubscription,
} from "@/lib/push-storage";
import { buildNotificationPayload, getWebPush } from "@/lib/webpush";

export async function sendToAllSubscriptions({ title, body, url = "/" }) {
  const subscriptions = await getAllSubscriptions();

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, errors: ["No subscriptions"] };
  }

  const webpush = getWebPush();
  const payload = buildNotificationPayload({ title, body, url });

  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription, payload);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("Failed to send push:", error);

      if (error.statusCode === 404 || error.statusCode === 410) {
        await removeSubscription(subscription.endpoint);
      }

      errors.push(error.message || "send failed");
    }
  }

  return { sent, failed, errors };
}
