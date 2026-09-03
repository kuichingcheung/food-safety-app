import * as cheerio from "cheerio";

export const CFS_BASE = "https://www.cfs.gov.hk";
export const UNSAT_MAIN_URL = `${CFS_BASE}/tc_chi/unsat_samples/unsat_samples.html`;
export const ALERT_MAIN_URL = `${CFS_BASE}/tc_chi/whatsnew/whatsnew_fa/whatsnew_fa.html`;
const MONTH_LIST_URL = `${CFS_BASE}/filemanager/pressrelease/tc_chi/list_UnsatisfactorySampleResult_7954_2.js`;
const MAX_ITEMS = 30;

export async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FoodSafetyApp/1.0; +local-dev)",
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${url}`);
  }

  return response.text();
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

/** Convert "1.9.2026" or "25.8.2026" to "2026-09-01". */
export function normalizeDate(raw) {
  const match = String(raw)
    .trim()
    .match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

  if (!match) {
    return raw.trim();
  }

  const [, day, month, year] = match;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function parseUnsatSamples(html) {
  const $ = cheerio.load(html);
  const items = [];

  $("table.pressTable tr").each((_, row) => {
    const $row = $(row);
    if ($row.hasClass("hdRow")) {
      return;
    }

    const dateCell = $row.find("td.subHeader").first();
    if (!dateCell.length) {
      return;
    }

    const dateText = dateCell
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (!dateText) {
      return;
    }

    const date = normalizeDate(dateText);

    $row.find("td ul li a").each((__, link) => {
      const title = $(link).text().replace(/\s+/g, " ").trim();
      const href = $(link).attr("href");

      if (!title) {
        return;
      }

      items.push({
        type: "unsat",
        typeLabel: "違規樣本",
        date,
        title,
        url: href ? new URL(href, CFS_BASE).href : null,
      });
    });
  });

  return items;
}

export function parseFoodAlerts(html) {
  const $ = cheerio.load(html);
  const items = [];

  $("table.pressTable tr.datarow").each((_, row) => {
    const $row = $(row);
    const dateCell = $row.find("td.subHeader").first();
    if (!dateCell.length) {
      return;
    }

    const dateText = dateCell
      .clone()
      .children()
      .remove()
      .end()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (!dateText) {
      return;
    }

    const date = normalizeDate(dateText);
    const category = $row.find("td.categoryfield").first().text().replace(/\s+/g, " ").trim();
    const typeLabel = category || "食物警報";

    $row.find("td ul li a").each((__, link) => {
      const title = $(link).text().replace(/\s+/g, " ").trim();
      const href = $(link).attr("href");

      if (!title) {
        return;
      }

      items.push({
        type: "alert",
        typeLabel,
        date,
        title,
        url: href ? new URL(href, CFS_BASE).href : null,
      });
    });
  });

  return items;
}

export function itemKey(item) {
  return `${item.type}|${item.typeLabel}|${item.date}|${item.title}|${item.url ?? ""}`;
}

/** @deprecated Use itemKey */
export function sampleKey(sample) {
  return itemKey(sample);
}

function monthsWithData(yearMonthMap, year) {
  const bitmask = yearMonthMap[String(year)];
  if (!bitmask) {
    return [];
  }

  const months = [];
  for (let month = 1; month <= 12; month += 1) {
    if (bitmask & (1 << (month - 1))) {
      months.push(month);
    }
  }
  return months;
}

function buildRecentUnsatMonthUrls(yearMonthMap, limit = 2) {
  const years = Object.keys(yearMonthMap)
    .map(Number)
    .sort((a, b) => b - a);

  const allMonths = [];

  for (const year of years) {
    const months = monthsWithData(yearMonthMap, year).sort((a, b) => b - a);
    for (const month of months) {
      allMonths.push({ year, month });
    }
  }

  return allMonths.slice(1, 1 + limit).map(
    ({ year, month }) =>
      `${CFS_BASE}/tc_chi/unsat_samples/${pad2(month)}-${year}.html`,
  );
}

function dedupeAndSort(items, limit = MAX_ITEMS) {
  const unique = [];
  const seen = new Set();

  for (const item of items) {
    const key = itemKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }

  unique.sort((a, b) => b.date.localeCompare(a.date));
  return unique.slice(0, limit);
}

/** Fetch current-month unsat samples for cron checks. */
export async function fetchMainPageUnsatItems() {
  const html = await fetchHtml(UNSAT_MAIN_URL);
  return parseUnsatSamples(html);
}

/** Fetch current-year food alerts for cron checks. */
export async function fetchMainPageAlertItems() {
  const html = await fetchHtml(ALERT_MAIN_URL);
  return parseFoodAlerts(html);
}

/** Fetch both sources from main pages for cron checks. */
export async function fetchMainPageItems() {
  const [unsatItems, alertItems] = await Promise.all([
    fetchMainPageUnsatItems(),
    fetchMainPageAlertItems(),
  ]);

  return dedupeAndSort([...unsatItems, ...alertItems], Number.MAX_SAFE_INTEGER);
}

/** Fetch mixed recent items for the homepage list. */
export async function fetchRecentItems() {
  const unsatHtml = await fetchHtml(UNSAT_MAIN_URL);
  const unsatItems = parseUnsatSamples(unsatHtml);

  try {
    const monthListText = await fetchHtml(MONTH_LIST_URL);
    const yearMonthMap = JSON.parse(monthListText);
    const archiveUrls = buildRecentUnsatMonthUrls(yearMonthMap, 2);

    for (const url of archiveUrls) {
      const html = await fetchHtml(url);
      unsatItems.push(...parseUnsatSamples(html));
    }
  } catch {
    // Keep main-page unsat results even if archive months fail.
  }

  let alertItems = [];
  try {
    const alertHtml = await fetchHtml(ALERT_MAIN_URL);
    alertItems = parseFoodAlerts(alertHtml);
  } catch {
    // Continue with unsat items only if alerts fail.
  }

  return dedupeAndSort([...unsatItems, ...alertItems]);
}

/** @deprecated Use fetchRecentItems */
export async function fetchRecentSamples() {
  return fetchRecentItems();
}

/** @deprecated Use fetchMainPageUnsatItems */
export async function fetchMainPageSamples() {
  return fetchMainPageUnsatItems();
}

/** @deprecated Use parseUnsatSamples */
export function parseSamples(html) {
  return parseUnsatSamples(html);
}
