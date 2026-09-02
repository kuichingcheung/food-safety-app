export const NEW_SAMPLES_NOTIFICATION_TITLE = "食安中心有新違規樣本";

/** Turn "菜心樣本除害劑殘餘超出法例標準" into "菜心 除害劑殘餘超出法例標準". */
export function formatSampleSummary(rawTitle) {
  const title = String(rawTitle || "").replace(/\s+/g, " ").trim();
  if (!title) {
    return "";
  }

  const marker = "樣本";
  const index = title.indexOf(marker);

  if (index === -1) {
    return title;
  }

  const food = title.slice(0, index).trim();
  const issue = title.slice(index + marker.length).trim();

  if (food && issue) {
    return `${food} ${issue}`;
  }

  return title;
}

export function sortSamplesNewestFirst(samples) {
  return [...samples].sort((a, b) => b.date.localeCompare(a.date));
}

export function buildNewSamplesNotification(newSamples) {
  if (!newSamples.length) {
    return {
      title: NEW_SAMPLES_NOTIFICATION_TITLE,
      body: "有新的違規樣本",
    };
  }

  const sorted = sortSamplesNewestFirst(newSamples);
  const latestSummary = formatSampleSummary(sorted[0].title);

  if (newSamples.length === 1) {
    return {
      title: NEW_SAMPLES_NOTIFICATION_TITLE,
      body: latestSummary,
    };
  }

  return {
    title: NEW_SAMPLES_NOTIFICATION_TITLE,
    body: `${latestSummary} 等共${newSamples.length}項`,
  };
}
