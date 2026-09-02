import { getLastSeenKeys, saveLastSeenKeys } from "@/lib/check-state";
import {
  fetchMainPageSamples,
  sampleKey,
} from "@/lib/cfs-samples";
import { buildNewSamplesNotification } from "@/lib/notification-messages";
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
    const currentSamples = await fetchMainPageSamples();

    if (currentSamples.length === 0) {
      return Response.json(
        { error: "無法取得違規樣本", checkedAt: new Date().toISOString() },
        { status: 502 },
      );
    }

    const currentKeys = currentSamples.map(sampleKey);
    const lastSeenKeys = await getLastSeenKeys();

    if (!lastSeenKeys) {
      await saveLastSeenKeys(currentKeys);

      return Response.json({
        success: true,
        initialized: true,
        notified: false,
        message: "首次檢查，已記錄現有樣本，未發送通知",
        sampleCount: currentSamples.length,
        checkedAt: new Date().toISOString(),
      });
    }

    const lastSeenSet = new Set(lastSeenKeys);
    const newSamples = currentSamples.filter(
      (sample) => !lastSeenSet.has(sampleKey(sample)),
    );

    if (newSamples.length === 0) {
      await saveLastSeenKeys(currentKeys);

      return Response.json({
        success: true,
        notified: false,
        newCount: 0,
        message: "沒有新樣本",
        checkedAt: new Date().toISOString(),
      });
    }

    const notification = buildNewSamplesNotification(newSamples);

    const notifyResult = await sendToAllSubscriptions({
      title: notification.title,
      body: notification.body,
      url: "/",
    });

    await saveLastSeenKeys(currentKeys);

    return Response.json({
      success: true,
      notified: notifyResult.sent > 0,
      newCount: newSamples.length,
      notification,
      newSamples: newSamples.map((sample) => ({
        date: sample.date,
        title: sample.title,
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
