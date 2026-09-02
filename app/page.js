"use client";

import { useEffect, useState } from "react";
import EnableNotifications from "./EnableNotifications";

function formatUpdatedAt(isoString) {
  const date = new Date(isoString);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export default function Home() {
  const [samples, setSamples] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSamples() {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch("/api/unsat-samples");
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.samples) || data.samples.length === 0) {
          throw new Error(data.error || "暫時無法取得資料");
        }

        if (!cancelled) {
          setSamples(data.samples);
          if (data.updatedAt) {
            setUpdatedAt(formatUpdatedAt(data.updatedAt));
          }
        }
      } catch {
        if (!cancelled) {
          setSamples([]);
          setUpdatedAt("");
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSamples();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="content">
      <h1>食安通知</h1>

      {!loading && updatedAt && (
        <p className="last-updated">最後更新：{updatedAt}</p>
      )}

      <p className="intro">資料來自食安中心，有新違規先通知你</p>

      <EnableNotifications />

      {loading && <p className="status">載入中…</p>}

      {!loading && error && (
        <p className="status error">暫時無法取得資料</p>
      )}

      {!loading && !error && (
        <ul className="sample-list">
          {samples.map((sample) => (
            <li key={`${sample.date}-${sample.title}-${sample.url ?? ""}`}>
              <span className="date">{sample.date}</span>
              {sample.url ? (
                <a
                  className="title"
                  href={sample.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sample.title}
                </a>
              ) : (
                <span className="title">{sample.title}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
