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

export default function EnableNotifications() {
  const [supported, setSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsIOS(ios);
    setIsStandalone(standalone);
    setSupported("serviceWorker" in navigator && "PushManager" in window && "Notification" in window);

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => {
        if (existing) {
          setSubscribed(true);
          setStatus("通知已開啟");
          console.log("Existing push subscription:", existing);
        }
      })
      .catch(() => {});
  }, []);

  async function handleEnable() {
    setBusy(true);
    setStatus("");

    try {
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        throw new Error("未設定 VAPID 公鑰，請先加入環境變數");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("你未允許通知權限");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          ),
        });
      }

      // Temporary: inspect in browser console. Storage comes later.
      console.log("Push subscription:", subscription);
      console.log("Push subscription JSON:", JSON.stringify(subscription));

      setSubscribed(true);
      setStatus("通知已開啟（subscription 已印喺 console）");
    } catch (error) {
      console.error("Enable notifications failed:", error);
      setStatus(error.message || "開啟通知失敗，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <div className="notify-box">
        <p className="notify-hint">
          {isIOS && !isStandalone
            ? "iPhone 請先用 Safari「加入主畫面」，再喺主畫面 App 入面開啟通知。"
            : "呢個瀏覽器暫時唔支援推送通知。"}
        </p>
      </div>
    );
  }

  return (
    <div className="notify-box">
      {isIOS && !isStandalone && (
        <p className="notify-hint">
          iPhone：請先加入主畫面，再用主畫面圖示打開 App，然後撳下面掣。
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
