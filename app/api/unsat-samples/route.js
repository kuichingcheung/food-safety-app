import { fetchRecentItems } from "@/lib/cfs-samples";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await fetchRecentItems();

    if (items.length === 0) {
      return Response.json(
        { error: "暫時無法取得資料", items: [] },
        { status: 502 },
      );
    }

    return Response.json({
      items,
      samples: items,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch CFS items:", error);
    return Response.json(
      { error: "暫時無法取得資料", items: [] },
      { status: 502 },
    );
  }
}
