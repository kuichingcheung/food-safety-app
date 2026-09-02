"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [samples, setSamples] = useState([]);
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
        }
      } catch {
        if (!cancelled) {
          setSamples([]);
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
      <p className="intro">每日自動檢查食安中心違規樣本</p>

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
