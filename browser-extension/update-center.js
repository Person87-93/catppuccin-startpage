// Google Apps Script-backed update center. Runs only in the extension service worker.
const UPDATE_REFRESH_ALARM = "browser-updates-refresh";
const UPDATE_CACHE_KEY = "browserUpdatesCache";
const UPDATE_SEEN_KEY = "browserUpdatesSeenIds";

async function readUpdateSettings() {
  const stored = await chrome.storage.local.get("browserFeatureSettings");
  const settings = stored.browserFeatureSettings || {};
  return {
    url: String(settings.updateApiUrl || "").trim(),
    key: String(settings.updateApiKey || "").trim(),
    topics: Array.isArray(settings.updateTopics) ? settings.updateTopics : ["vex", "xbox", "fortnite", "browser"],
    notifications: settings.browserNotifications === true,
    frequency: settings.updateFrequency || "6h",
  };
}

function validUpdateEndpoint(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "script.google.com"
      && /^\/macros\/s\/[^/]+\/exec\/?$/.test(url.pathname);
  } catch {
    return false;
  }
}

async function updateApiRequest(action, payload = null) {
  const settings = await readUpdateSettings();
  if (!validUpdateEndpoint(settings.url)) {
    throw new Error("Add a deployed Google Apps Script /exec URL in Update settings first.");
  }
  if (!settings.key) throw new Error("Add your Apps Script API key in Update settings first.");

  let response;
  if (payload) {
    response = await fetch(settings.url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, action, key: settings.key }),
    });
  } else {
    const url = new URL(settings.url);
    url.searchParams.set("action", action);
    url.searchParams.set("key", settings.key);
    response = await fetch(url.toString(), { method: "GET", redirect: "follow" });
  }
  if (!response.ok) throw new Error("Apps Script returned HTTP " + response.status + ".");
  const data = await response.json();
  if (!data?.ok) throw new Error(data?.error || "The update service returned an error.");
  return data;
}

function filterUpdateTopics(updates, topics) {
  const enabled = new Set(topics);
  return updates.filter(item => enabled.has(item.category));
}

async function refreshUpdateFeed(notify = false) {
  const settings = await readUpdateSettings();
  const data = await updateApiRequest("feed");
  const updates = Array.isArray(data.updates) ? data.updates : [];
  const previous = await chrome.storage.local.get([UPDATE_CACHE_KEY, UPDATE_SEEN_KEY]);
  const previousIds = new Set(Array.isArray(previous[UPDATE_SEEN_KEY]) ? previous[UPDATE_SEEN_KEY] : []);
  const currentIds = updates.map(item => item.id).filter(Boolean);
  const fresh = previous[UPDATE_SEEN_KEY] ? updates.filter(item => item.id && !previousIds.has(item.id)) : [];

  await chrome.storage.local.set({
    [UPDATE_CACHE_KEY]: { updates, sources: data.sources || [], lastRun: data.lastRun || "", fetchedAt: new Date().toISOString() },
    [UPDATE_SEEN_KEY]: currentIds.slice(0, 200),
  });

  if (notify && fresh.length && settings.notifications && chrome.notifications
      && await chrome.permissions.contains({ permissions: ["notifications"] })) {
    const relevant = filterUpdateTopics(fresh, settings.topics).slice(0, 3);
    for (const item of relevant) {
      try {
        await chrome.notifications.create("browser-update-" + item.id.slice(0, 20), {
          type: "basic",
          iconUrl: "src/img/favicon.png",
          title: item.title || "New update",
          message: (item.source || "Update center") + " · " + (item.category || "news"),
          contextMessage: "Open the update center to read more.",
        });
      } catch (error) {
        recordDiagnosticError(error);
      }
    }
  }

  return {
    ok: true,
    updates: filterUpdateTopics(updates, settings.topics),
    sources: data.sources || [],
    lastRun: data.lastRun || "",
    fetchedAt: new Date().toISOString(),
  };
}

async function getUpdateFeed() {
  return refreshUpdateFeed(false);
}

async function updateAlarmSetup() {
  const settings = await readUpdateSettings();
  if (validUpdateEndpoint(settings.url) && settings.key) {
    const intervals = { "6h": 360, "12h": 720, daily: 1440, weekly: 10080 };
    await chrome.alarms.create(UPDATE_REFRESH_ALARM, { periodInMinutes: intervals[settings.frequency] || 360 });
  } else {
    await chrome.alarms.clear(UPDATE_REFRESH_ALARM);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  updateAlarmSetup().catch(recordDiagnosticError);
  syncRemoteFrequency().catch(recordDiagnosticError);
});
chrome.runtime.onStartup.addListener(() => {
  updateAlarmSetup().catch(recordDiagnosticError);
  syncRemoteFrequency().catch(recordDiagnosticError);
});
async function syncRemoteFrequency() {
  const settings = await readUpdateSettings();
  if (!validUpdateEndpoint(settings.url) || !settings.key) return;
  await updateApiRequest("set-frequency", { frequency: settings.frequency });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.browserFeatureSettings) {
    updateAlarmSetup().catch(recordDiagnosticError);
    syncRemoteFrequency().catch(recordDiagnosticError);
  }
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === UPDATE_REFRESH_ALARM) refreshUpdateFeed(true).catch(recordDiagnosticError);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type?.startsWith("browser-updates-")) return false;
  (async () => {
    switch (message.type) {
      case "browser-updates-feed-get":
      case "browser-updates-refresh":
        return await getUpdateFeed();
      case "browser-updates-collect-now": {
        await updateApiRequest("collect-now", {});
        return await refreshUpdateFeed(false);
      }
      case "browser-updates-source-add": {
        const result = await updateApiRequest("source-add", { source: message.source || {} });
        return { ok: true, sources: result.sources || [] };
      }
      case "browser-updates-source-toggle": {
        const result = await updateApiRequest("source-toggle", { id: message.id, enabled: message.enabled === true });
        return { ok: true, sources: result.sources || [] };
      }
      case "browser-updates-source-remove": {
        const result = await updateApiRequest("source-remove", { id: message.id });
        return { ok: true, sources: result.sources || [] };
      }
      default:
        return { ok: false, error: "Unknown update-center action." };
    }
  })().then(sendResponse).catch(error => {
    recordDiagnosticError(error);
    sendResponse({ ok: false, error: error.message || "The update service could not be reached." });
  });
  return true;
});
