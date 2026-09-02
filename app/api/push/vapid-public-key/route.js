export async function GET() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return Response.json(
      { error: "未設定 VAPID 公鑰，請喺 Vercel 加入環境變數後重新部署" },
      { status: 500 },
    );
  }

  return Response.json({ publicKey });
}
