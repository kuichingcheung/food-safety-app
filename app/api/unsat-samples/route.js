import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

const CFS_BASE = "https://www.cfs.gov.hk";
const MAIN_URL = `${CFS_BASE}/tc_chi/unsat_samples/unsat_samples.html`;
const MONTH_LIST_URL = `${CFS_BASE}/filemanager/pressrelease/tc_chi/list_UnsatisfactorySampleResult_7954_2.js`;
const MAX_SAMPLES = 20;

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; FoodSafetyApp/1.0; +local-dev)",
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
function normalizeDate(raw) {
  const match = String(raw)
    .trim()
    .match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);

  if (!match) {
    return raw.trim();
  }

  const [, day, month, year] = match;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseSamples(html) {
  const $ = cheerio.load(html);
  const samples = [];

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

      samples.push({
        date,
        title,
        url: href ? new URL(href, CFS_BASE).href : null,
      });
    });
  });

  return samples;
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

function buildRecentMonthUrls(yearMonthMap, limit = 2) {
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

  // Newest month is already covered by MAIN_URL; take the next few archives.
  return allMonths.slice(1, 1 + limit).map(
    ({ year, month }) =>
      `${CFS_BASE}/tc_chi/unsat_samples/${pad2(month)}-${year}.html`,
  );
}

export async function GET() {
  try {
    const mainHtml = await fetchHtml(MAIN_URL);
    const samples = parseSamples(mainHtml);

    // Main page only shows the current month; also pull recent archive months.
    try {
      const monthListText = await fetchHtml(MONTH_LIST_URL);
      const yearMonthMap = JSON.parse(monthListText);
      const archiveUrls = buildRecentMonthUrls(yearMonthMap, 2);

      for (const url of archiveUrls) {
        if (samples.length >= MAX_SAMPLES) {
          break;
        }

        const html = await fetchHtml(url);
        samples.push(...parseSamples(html));
      }
    } catch {
      // Keep main-page results even if archive months fail.
    }

    const unique = [];
    const seen = new Set();

    for (const sample of samples) {
      const key = `${sample.date}|${sample.title}|${sample.url ?? ""}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      unique.push(sample);
      if (unique.length >= MAX_SAMPLES) {
        break;
      }
    }

    if (unique.length === 0) {
      return Response.json(
        { error: "暫時無法取得資料", samples: [] },
        { status: 502 },
      );
    }

    return Response.json({ samples: unique });
  } catch (error) {
    console.error("Failed to fetch CFS unsat samples:", error);
    return Response.json(
      { error: "暫時無法取得資料", samples: [] },
      { status: 502 },
    );
  }
}
