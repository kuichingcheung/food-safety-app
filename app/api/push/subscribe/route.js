import { saveSubscription } from "@/lib/push-storage";

export async function POST(request) {
  try {
    const subscription = await request.json();

    if (!subscription?.endpoint || !subscription?.keys) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await saveSubscription(subscription);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to save subscription:", error);
    return Response.json(
      { error: "Failed to save subscription" },
      { status: 500 },
    );
  }
}
