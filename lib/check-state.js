const LAST_SEEN_KEY = "check:last-seen-keys-v2";
let memoryLastSeenKeys = null;

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKv() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

export async function getLastSeenKeys() {
  if (hasKv()) {
    const kv = await getKv();
    const keys = await kv.get(LAST_SEEN_KEY);
    return Array.isArray(keys) ? keys : null;
  }

  return memoryLastSeenKeys;
}

export async function saveLastSeenKeys(keys) {
  const value = Array.isArray(keys) ? keys : [];

  if (hasKv()) {
    const kv = await getKv();
    await kv.set(LAST_SEEN_KEY, value);
    return;
  }

  memoryLastSeenKeys = value;
}
