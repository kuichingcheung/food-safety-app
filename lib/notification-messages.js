export const NEW_ITEMS_NOTIFICATION_TITLE = "食安中心有新消息";

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

export function formatItemDisplayText(item) {
  if (item?.type === "unsat") {
    return formatSampleSummary(item.title);
  }

  return String(item?.title || "").replace(/\s+/g, " ").trim();
}

export function formatItemLine(item) {
  return `[${item.typeLabel}] ${formatItemDisplayText(item)}`;
}

export function sortItemsNewestFirst(items) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

export function buildNewItemsNotification(newItems) {
  if (!newItems.length) {
    return {
      title: NEW_ITEMS_NOTIFICATION_TITLE,
      body: "有新的食安消息",
    };
  }

  const sorted = sortItemsNewestFirst(newItems);
  const latestLine = formatItemLine(sorted[0]);

  if (newItems.length === 1) {
    return {
      title: NEW_ITEMS_NOTIFICATION_TITLE,
      body: latestLine,
    };
  }

  return {
    title: NEW_ITEMS_NOTIFICATION_TITLE,
    body: `${latestLine} 等共${newItems.length}項`,
  };
}

/** @deprecated Use buildNewItemsNotification */
export const NEW_SAMPLES_NOTIFICATION_TITLE = NEW_ITEMS_NOTIFICATION_TITLE;

/** @deprecated Use sortItemsNewestFirst */
export function sortSamplesNewestFirst(samples) {
  return sortItemsNewestFirst(samples);
}

/** @deprecated Use buildNewItemsNotification */
export function buildNewSamplesNotification(newSamples) {
  return buildNewItemsNotification(newSamples);
}
