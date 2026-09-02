const ENDPOINTS_KEY = "push:endpoints";
const memorySubscriptions = new Map();

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKv() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

function subscriptionKey(endpoint) {
  return `push:sub:${endpoint}`;
}

export async function saveSubscription(subscription) {
  if (!subscription?.endpoint) {
    throw new Error("Invalid subscription");
  }

  if (hasKv()) {
    const kv = await getKv();
    await kv.set(subscriptionKey(subscription.endpoint), subscription);
    await kv.sadd(ENDPOINTS_KEY, subscription.endpoint);
    return;
  }

  memorySubscriptions.set(subscription.endpoint, subscription);
}

export async function getAllSubscriptions() {
  if (hasKv()) {
    const kv = await getKv();
    const endpoints = await kv.smembers(ENDPOINTS_KEY);
    if (!endpoints?.length) {
      return [];
    }

    const subscriptions = await Promise.all(
      endpoints.map((endpoint) => kv.get(subscriptionKey(endpoint))),
    );

    return subscriptions.filter(Boolean);
  }

  return Array.from(memorySubscriptions.values());
}

export async function removeSubscription(endpoint) {
  if (!endpoint) {
    return;
  }

  if (hasKv()) {
    const kv = await getKv();
    await kv.del(subscriptionKey(endpoint));
    await kv.srem(ENDPOINTS_KEY, endpoint);
    return;
  }

  memorySubscriptions.delete(endpoint);
}
