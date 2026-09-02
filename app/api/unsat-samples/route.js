import { fetchRecentSamples } from "@/lib/cfs-samples";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const samples = await fetchRecentSamples();

    if (samples.length === 0) {
      return Response.json(
        { error: "暫時無法取得資料", samples: [] },
        { status: 502 },
      );
    }

    return Response.json({ samples });
  } catch (error) {
    console.error("Failed to fetch CFS unsat samples:", error);
    return Response.json(
      { error: "暫時無法取得資料", samples: [] },
      { status: 502 },
    );
  }
}
