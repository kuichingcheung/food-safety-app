"use client";

import { useEffect, useState } from "react";
import EnableNotifications from "./EnableNotifications";
import SampleShareButton from "./SampleShareButton";
import { formatItemDisplayText } from "@/lib/notification-messages";

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

function typeBadgeClass(typeLabel) {
  if (typeLabel === "致敏物警報") {
    return "type-badge type-badge-allergen";
  }

  if (typeLabel === "食物警報") {
    return "type-badge type-badge-alert";
  }

  return "type-badge type-badge-unsat";
}

const FILTERS = [
  { id: "all", label: "全部" },
  { id: "unsat", label: "違規樣本" },
  { id: "alert", label: "食物警報" },
];

function filterItems(items, filter) {
  if (filter === "unsat") {
    return items.filter((item) => item.type === "unsat");
  }

  if (filter === "alert") {
    return items.filter((item) => item.type === "alert");
  }

  return items;
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch("/api/unsat-samples");
        const data = await response.json();
        const list = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.samples)
            ? data.samples
            : [];

        if (!response.ok || list.length === 0) {
          throw new Error(data.error || "暫時無法取得資料");
        }

        if (!cancelled) {
          setItems(list);
          if (data.updatedAt) {
            setUpdatedAt(formatUpdatedAt(data.updatedAt));
          }
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setUpdatedAt("");
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = filterItems(items, filter);

  return (
    <main className="content">
      <h1>食安通知</h1>

      {!loading && updatedAt && (
        <p className="last-updated">最後更新：{updatedAt}</p>
      )}

      <p className="intro">資料來自食安中心，有新消息先通知你</p>

      <EnableNotifications />

      {loading && <p className="status">載入中…</p>}

      {!loading && error && (
        <p className="status error">暫時無法取得資料</p>
      )}

      {!loading && !error && (
        <>
          <div className="filter-bar" role="tablist" aria-label="篩選類型">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={filter === option.id}
                className={`filter-button${filter === option.id ? " active" : ""}`}
                onClick={() => setFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <p className="status">此類別暫時沒有資料</p>
          ) : (
            <ul className="sample-list">
              {filteredItems.map((item) => {
                const itemKey = `${item.type}-${item.typeLabel}-${item.date}-${item.title}-${item.url ?? ""}`;
                const displayText = formatItemDisplayText(item);

                return (
                  <li key={itemKey}>
                    <div className="sample-header">
                      <span className="date">{item.date}</span>
                      <SampleShareButton item={item} />
                    </div>
                    <div className="sample-content">
                      <span className={typeBadgeClass(item.typeLabel)}>
                        [{item.typeLabel}]
                      </span>
                      {item.url ? (
                        <a
                          className="title"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {displayText}
                        </a>
                      ) : (
                        <span className="title">{displayText}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
