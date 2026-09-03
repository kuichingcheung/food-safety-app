import { getLastSeenKeys, saveLastSeenKeys } from "@/lib/check-state";
import {
  fetchMainPageItems,
  itemKey,
} from "@/lib/cfs-samples";
import { buildNewItemsNotification } from "@/lib/notification-messages";
import { sendToAllSubscriptions } from "@/lib/push-notify";

export const dynamic = "force-dynamic";

function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const currentItems = await fetchMainPageItems();

    if (currentItems.length === 0) {
      return Response.json(
        { error: "無法取得食安資料", checkedAt: new Date().toISOString() },
        { status: 502 },
      );
    }

    const currentKeys = currentItems.map(itemKey);
    const lastSeenKeys = await getLastSeenKeys();

    if (!lastSeenKeys) {
      await saveLastSeenKeys(currentKeys);

      return Response.json({
        success: true,
        initialized: true,
        notified: false,
        message: "首次檢查，已記錄現有資料，未發送通知",
        itemCount: currentItems.length,
        checkedAt: new Date().toISOString(),
      });
    }

    const lastSeenSet = new Set(lastSeenKeys);
    const newItems = currentItems.filter(
      (item) => !lastSeenSet.has(itemKey(item)),
    );

    if (newItems.length === 0) {
      await saveLastSeenKeys(currentKeys);

      return Response.json({
        success: true,
        notified: false,
        newCount: 0,
        message: "沒有新消息",
        checkedAt: new Date().toISOString(),
      });
    }

    const notification = buildNewItemsNotification(newItems);

    const notifyResult = await sendToAllSubscriptions({
      title: notification.title,
      body: notification.body,
      url: "/",
    });

    await saveLastSeenKeys(currentKeys);

    return Response.json({
      success: true,
      notified: notifyResult.sent > 0,
      newCount: newItems.length,
      notification,
      newItems: newItems.map((item) => ({
        type: item.type,
        typeLabel: item.typeLabel,
        date: item.date,
        title: item.title,
      })),
      sent: notifyResult.sent,
      failed: notifyResult.failed,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron check failed:", error);
    return Response.json(
      { error: error.message || "自動檢查失敗" },
      { status: 500 },
    );
  }
}
