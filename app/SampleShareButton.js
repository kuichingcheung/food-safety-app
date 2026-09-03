"use client";

import { useState } from "react";
import {
  formatItemDisplayText,
  formatItemLine,
} from "@/lib/notification-messages";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://food-safety-notification.vercel.app/";

function buildShareText(item) {
  const line = formatItemLine(item);
  return `${line}\n\n來自食安通知\n${SITE_URL}`;
}

export default function SampleShareButton({ item }) {
  const [feedback, setFeedback] = useState("");
  const displayText = formatItemDisplayText(item);
  const shareLine = formatItemLine(item);

  async function handleShare() {
    const shareText = buildShareText(item);

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareLine,
          text: `來自食安通知\n${SITE_URL}`,
          url: SITE_URL,
        });
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setFeedback("已複製");
      window.setTimeout(() => setFeedback(""), 2000);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareText);
        setFeedback("已複製");
        window.setTimeout(() => setFeedback(""), 2000);
      } catch {
        setFeedback("分享失敗");
        window.setTimeout(() => setFeedback(""), 2000);
      }
    }
  }

  return (
    <button
      type="button"
      className="share-button"
      onClick={handleShare}
      aria-label={`分享 ${displayText}`}
    >
      {feedback || "分享"}
    </button>
  );
}
