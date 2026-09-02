import {
  getAllSubscriptions,
  removeSubscription,
} from "@/lib/push-storage";
import { buildNotificationPayload, getWebPush } from "@/lib/webpush";

export async function POST() {
  try {
    const subscriptions = await getAllSubscriptions();

    if (subscriptions.length === 0) {
      return Response.json(
        { error: "未有已儲存的 subscription，請先撳「開啟通知」" },
        { status: 404 },
      );
    }

    const webpush = getWebPush();
    const payload = buildNotificationPayload({
      title: "食安通知測試",
      body: "你已成功收到測試推送通知。",
      url: "/",
    });

    let sent = 0;
    const errors = [];

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (error) {
        console.error("Failed to send push:", error);

        if (error.statusCode === 404 || error.statusCode === 410) {
          await removeSubscription(subscription.endpoint);
        }

        errors.push(error.message || "send failed");
      }
    }

    if (sent === 0) {
      return Response.json(
        { error: "發送失敗，請重新開啟通知後再試" },
        { status: 502 },
      );
    }

    return Response.json({
      success: true,
      sent,
      failed: errors.length,
    });
  } catch (error) {
    console.error("Send test notification failed:", error);
    return Response.json(
      { error: error.message || "發送測試通知失敗" },
      { status: 500 },
    );
  }
}
