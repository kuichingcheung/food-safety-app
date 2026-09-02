import { sendToAllSubscriptions } from "@/lib/push-notify";

export async function POST() {
  try {
    const result = await sendToAllSubscriptions({
      title: "食安通知測試",
      body: "你已成功收到測試推送通知。",
      url: "/",
    });

    if (result.sent === 0) {
      return Response.json(
        { error: "未有已儲存的 subscription，請先撳「開啟通知」" },
        { status: result.errors.includes("No subscriptions") ? 404 : 502 },
      );
    }

    return Response.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Send test notification failed:", error);
    return Response.json(
      { error: error.message || "發送測試通知失敗" },
      { status: 500 },
    );
  }
}
