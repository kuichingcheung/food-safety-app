"use client";

import { useState } from "react";
import { formatSampleSummary } from "@/lib/notification-messages";

const SITE_URL = "https://food-safety-app-eight.vercel.app/";

function buildShareText(title) {
  const summary = formatSampleSummary(title);
  return `${summary}\n\n來自食安通知\n${SITE_URL}`;
}

export default function SampleShareButton({ title }) {
  const [feedback, setFeedback] = useState("");

  async function handleShare() {
    const shareText = buildShareText(title);
    const summary = formatSampleSummary(title);

    try {
      if (navigator.share) {
        await navigator.share({
          title: summary,
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
      aria-label={`分享 ${formatSampleSummary(title)}`}
    >
      {feedback || "分享"}
    </button>
  );
}
