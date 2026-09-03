"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function canUsePush() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getVapidPublicKey() {
  const response = await fetch("/api/push/vapid-public-key");
  const data = await response.json();

  if (!response.ok || !data.publicKey) {
    throw new Error(data.error || "未設定 VAPID 公鑰，請先加入環境變數");
  }

  return data.publicKey;
}

async function saveSubscriptionToServer(subscription) {
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "儲存 subscription 失敗");
  }
}

export default function EnableNotifications() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const ios = isIOSDevice();
    const standalone = isStandaloneApp();
    const pushSupported = canUsePush();

    setIsIOS(ios);
    setIsStandalone(standalone);
    setSupported(pushSupported);

    if (!pushSupported) {
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then(async (existing) => {
        if (!existing) {
          return;
        }

        setSubscribed(true);
        setStatus("通知已開啟");
        await saveSubscriptionToServer(existing.toJSON());
      })
      .catch(() => {});
  }, []);

  async function handleEnable() {
    setBusy(true);
    setStatus("");

    try {
      if (isIOS && !isStandalone) {
        setStatus(
          "請先用 Safari 撳「分享」→「加入主畫面」，再從主畫面圖示打開 App，然後再撳「開啟通知」。",
        );
        return;
      }

      if (!supported) {
        setStatus("呢個瀏覽器暫時唔支援推送通知。請用 Chrome（電腦）或 iPhone 主畫面 App 測試。");
        return;
      }

      const vapidPublicKey = await getVapidPublicKey();

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("你未允許通知權限。可到「設定 → 通知」檢查是否已開啟。");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      await saveSubscriptionToServer(subscription.toJSON());

      setSubscribed(true);
      setStatus("通知已開啟");
    } catch (error) {
      console.error("Enable notifications failed:", error);
      setStatus(error.message || "開啟通知失敗，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  const showIOSHint = isIOS && !isStandalone;

  return (
    <div className="notify-box">
      {showIOSHint && (
        <p className="notify-hint notify-hint-warning">
          iPhone 必須用「加入主畫面」後嘅 App 先可以開通知（Safari 分頁唔得）。
        </p>
      )}

      <button
        type="button"
        className="notify-button"
        onClick={handleEnable}
        disabled={busy || subscribed}
      >
        {busy ? "處理中…" : subscribed ? "通知已開啟" : "開啟通知"}
      </button>

      {status && <p className="notify-status">{status}</p>}
    </div>
  );
}
