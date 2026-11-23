// Browser-wide workspace, focus, context-menu, and diagnostics services.
const WORKSPACE_KEY = "browserWorkspaces";
const FOCUS_KEY = "browserFocus";
const FEATURE_SETTINGS_KEY = "browserFeatureSettings";
const DIAGNOSTICS_KEY = "browserDiagnostics";
const NOTES_KEY = "browserQuickNotes";

const focusDefaults = {
  enabled: false,
  sites: [],
  schedule: { enabled: false, start: "09:00", end: "17:00", days: [1, 2, 3, 4, 5] },
};

const featureDefaults = {
  openLastWorkspace: false,
  defaultWorkspaceId: "",
  saveBeforeRestore: false,
  paletteShortcut: "Ctrl+Shift+K",
  updateTopics: ["vex", "xbox", "fortnite", "browser"],
  updateFrequency: "6h",
  updateApiUrl: "",
  updateApiKey: "",
  browserNotifications: false,
  emailDigests: false,
  contextMenuEnabled: true,
  diagnosticsHistory: true,
};

function cleanWorkspaceName(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 48) : "";
}

function cleanSites(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((site) => String(site).trim().toLowerCase())
    .filter((site) => site && !site.includes("/") && !/\\s/.test(site) && site.length <= 253))].slice(0, 100);
}

async function readWorkspaces() {
  const stored = await chrome.storage.local.get(WORKSPACE_KEY);
  return Array.isArray(stored[WORKSPACE_KEY]) ? stored[WORKSPACE_KEY] : [];
}

async function writeWorkspaces(workspaces) {
  await chrome.storage.local.set({ [WORKSPACE_KEY]: workspaces });
  await refreshWorkspaceMenus(workspaces);
  return workspaces;
}

async function saveWorkspace(name) {
  const title = cleanWorkspaceName(name);
  if (!title) return { ok: false, error: "Enter a workspace name." };
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const savedTabs = tabs.filter((tab) => tab.url && /^https?:/i.test(tab.url))
    .map((tab) => ({ url: tab.url, title: tab.title || tab.url, favIconUrl: tab.favIconUrl || "" }));
  if (!savedTabs.length) return { ok: false, error: "There are no regular website tabs to save." };

  const workspaces = await readWorkspaces();
  const existing = workspaces.find((item) => item.name.toLowerCase() === title.toLowerCase());
  const workspace = {
    id: existing?.id || crypto.randomUUID(),
    name: title,
    tabs: savedTabs,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  const next = existing
    ? workspaces.map((item) => item.id === existing.id ? workspace : item)
    : [...workspaces, workspace];
  await writeWorkspaces(next);
  await chrome.storage.local.set({ activeWorkspaceId: workspace.id });
  return { ok: true, workspace, count: savedTabs.length };
}

async function restoreWorkspace(id) {
  const featureState = await chrome.storage.local.get(FEATURE_SETTINGS_KEY);
  if (featureState[FEATURE_SETTINGS_KEY]?.saveBeforeRestore) {
    const active = await chrome.storage.local.get("activeWorkspaceId");
    const currentWorkspace = (await readWorkspaces()).find((item) => item.id === active.activeWorkspaceId);
    if (currentWorkspace) {
      const currentTabs = await chrome.tabs.query({ currentWindow: true });
      const captured = currentTabs.filter((tab) => tab.url && /^https?:/i.test(tab.url))
        .map((tab) => ({ url: tab.url, title: tab.title || tab.url, favIconUrl: tab.favIconUrl || "" }));
      await writeWorkspaces((await readWorkspaces()).map((item) => item.id === currentWorkspace.id
        ? { ...item, tabs: captured, updatedAt: new Date().toISOString() } : item));
    }
  }
  const workspaces = await readWorkspaces();
  const workspace = workspaces.find((item) => item.id === id);
  if (!workspace) return { ok: false, error: "That workspace could not be found." };

  const existingTabs = await chrome.tabs.query({});
  const existingUrls = new Set(existingTabs.map((tab) => tab.url).filter(Boolean));
  const createdIds = [];
  for (const saved of workspace.tabs) {
    if (!saved?.url || !/^https?:/i.test(saved.url) || existingUrls.has(saved.url)) continue;
    const tab = await chrome.tabs.create({ url: saved.url, active: false });
    if (tab.id) createdIds.push(tab.id);
  }

  if (createdIds.length > 1 && chrome.tabGroups?.group) {
    try {
      const groupId = await chrome.tabs.group({ tabIds: createdIds });
      await chrome.tabGroups.update(groupId, { title: workspace.name, color: "purple", collapsed: false });
    } catch {
      // Restoring tabs still succeeds if tab grouping is unavailable.
    }
  }

  await chrome.storage.local.set({ activeWorkspaceId: id });
  return { ok: true, opened: createdIds.length, skipped: workspace.tabs.length - createdIds.length };
}

async function duplicateWorkspace(id) {
  const workspaces = await readWorkspaces();
  const source = workspaces.find((item) => item.id === id);
  if (!source) return { ok: false, error: "That workspace could not be found." };
  let name = cleanWorkspaceName(source.name + " copy");
  let suffix = 2;
  while (workspaces.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    name = cleanWorkspaceName(source.name + " copy " + suffix++);
  }
  const duplicate = { ...source, id: crypto.randomUUID(), name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tabs: source.tabs.map((tab) => ({ ...tab })) };
  await writeWorkspaces([...workspaces, duplicate]);
  return { ok: true, workspace: duplicate };
}

async function deleteWorkspace(id) {
  const workspaces = await readWorkspaces();
  const next = workspaces.filter((item) => item.id !== id);
  await writeWorkspaces(next);
  const [active, preferences] = await Promise.all([
    chrome.storage.local.get("activeWorkspaceId"),
    chrome.storage.local.get(FEATURE_SETTINGS_KEY),
  ]);
  if (active.activeWorkspaceId === id) await chrome.storage.local.remove("activeWorkspaceId");
  if (preferences[FEATURE_SETTINGS_KEY]?.defaultWorkspaceId === id) {
    await chrome.storage.local.set({ [FEATURE_SETTINGS_KEY]: { ...featureDefaults, ...(preferences[FEATURE_SETTINGS_KEY] || {}), defaultWorkspaceId: "" } });
  }
  return { ok: true };
}

async function renameWorkspace(id, name) {
  const title = cleanWorkspaceName(name);
  if (!title) return { ok: false, error: "Enter a workspace name." };
  const workspaces = await readWorkspaces();
  if (workspaces.some((item) => item.id !== id && item.name.toLowerCase() === title.toLowerCase())) {
    return { ok: false, error: "A workspace with that name already exists." };
  }
  const next = workspaces.map((item) => item.id === id ? { ...item, name: title } : item);
  await writeWorkspaces(next);
  return { ok: true };
}

async function readFocusSettings() {
  const stored = await chrome.storage.local.get(FOCUS_KEY);
  const value = stored[FOCUS_KEY] && typeof stored[FOCUS_KEY] === "object" ? stored[FOCUS_KEY] : {};
  return {
    ...focusDefaults,
    ...value,
    sites: cleanSites(value.sites),
    schedule: { ...focusDefaults.schedule, ...(value.schedule || {}) },
  };
}

async function writeFocusSettings(input) {
  const settings = {
    enabled: input?.enabled === true,
    sites: cleanSites(input?.sites),
    schedule: {
      enabled: input?.schedule?.enabled === true,
      start: /^([01]\d|2[0-3]):[0-5]\d$/.test(input?.schedule?.start || "") ? input.schedule.start : "09:00",
      end: /^([01]\d|2[0-3]):[0-5]\d$/.test(input?.schedule?.end || "") ? input.schedule.end : "17:00",
      days: Array.isArray(input?.schedule?.days) ? [...new Set(input.schedule.days.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))] : [1, 2, 3, 4, 5],
    },
  };
  await chrome.storage.local.set({ [FOCUS_KEY]: settings });
  await evaluateFocus();
  return settings;
}

function isScheduleActive(schedule, date = new Date()) {
  if (!schedule?.enabled) return false;
  const [startHour, startMinute] = schedule.start.split(":").map(Number);
  const [endHour, endMinute] = schedule.end.split(":").map(Number);
  const now = date.getHours() * 60 + date.getMinutes();
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  if (start === end) return false;
  if (start < end) return schedule.days?.includes(date.getDay()) && now >= start && now < end;
  if (now >= start) return schedule.days?.includes(date.getDay());
  const previousDay = (date.getDay() + 6) % 7;
  return now < end && schedule.days?.includes(previousDay);
}

async function evaluateFocus() {
  const settings = await readFocusSettings();
  const storedOverride = await chrome.storage.local.get("focusOverrideUntil");
  const overrideActive = Number(storedOverride.focusOverrideUntil) > Date.now();
  const active = !overrideActive && (settings.enabled || isScheduleActive(settings.schedule));
  const previous = await chrome.storage.local.get("focusRuntime");
  const runtime = { active, checkedAt: new Date().toISOString(), reason: overrideActive ? "temporary-override" : settings.enabled ? "manual" : active ? "schedule" : "inactive" };
  await chrome.storage.local.set({ focusRuntime: runtime });
  if (previous.focusRuntime?.active !== active) {
    await chrome.tabs.query({}).then((tabs) => tabs.forEach((tab) => {
      if (tab.id) chrome.tabs.sendMessage(tab.id, { type: "browser-focus-refresh" }).catch(() => {});
    }));
    if (active && settings.sites.length) await showFocusNotification("Focus mode is on");
  }
  return { settings, runtime };
}

async function showFocusNotification(title) {
  const stored = await chrome.storage.local.get(FEATURE_SETTINGS_KEY);
  if (!stored[FEATURE_SETTINGS_KEY]?.browserNotifications || !chrome.notifications) return;
  chrome.notifications.create("browser-focus-status", {
    type: "basic",
    iconUrl: "src/img/favicon.png",
    title,
    message: "Your selected focus schedule is active.",
  }).catch(() => {});
}

async function getDiagnostics() {
  const [tabs, workspaces, focus, settings, stored] = await Promise.all([
    chrome.tabs.query({}),
    readWorkspaces(),
    evaluateFocus(),
    chrome.storage.local.get(FEATURE_SETTINGS_KEY),
    chrome.storage.local.get(null),
  ]);
  const bytes = new Blob([JSON.stringify(stored)]).size;
  let tabGroupCount = 0;
  try { tabGroupCount = (await chrome.tabGroups.query({})).length; } catch {}
  let pagePerformance = null;
  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (activeTab?.id && /^https?:/i.test(activeTab.url || "")) {
    try {
      const [measurement] = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          const navigation = performance.getEntriesByType("navigation")[0];
          return navigation ? {
            domInteractiveMs: Math.round(navigation.domInteractive),
            loadCompleteMs: Math.round(navigation.loadEventEnd),
            transferBytes: navigation.transferSize || 0,
          } : null;
        },
      });
      pagePerformance = measurement?.result || null;
    } catch {}
  }
  const errors = Array.isArray(stored[DIAGNOSTICS_KEY]) ? stored[DIAGNOSTICS_KEY].slice(-20) : [];
  return {
    extensionVersion: chrome.runtime.getManifest().version,
    totalTabs: tabs.length,
    regularTabs: tabs.filter((tab) => /^https?:/i.test(tab.url || "")).length,
    workspaceCount: workspaces.length,
    workspaceTabCount: workspaces.reduce((sum, item) => sum + (item.tabs?.length || 0), 0),
    duplicateTabCount: tabs.length - new Set(tabs.map((tab) => tab.url).filter(Boolean)).size,
    tabGroupCount,
    pagePerformance,
    focusActive: focus.runtime.active,
    focusSiteCount: focus.settings.sites.length,
    extensionStorageBytes: bytes,
    recentErrors: errors,
    notificationsEnabled: settings[FEATURE_SETTINGS_KEY]?.browserNotifications === true,
  };
}

async function recordDiagnosticError(error) {
  try {
    const stored = await chrome.storage.local.get(DIAGNOSTICS_KEY);
    const preferences = await chrome.storage.local.get(FEATURE_SETTINGS_KEY);
    if (preferences[FEATURE_SETTINGS_KEY]?.diagnosticsHistory === false) return;
    const history = Array.isArray(stored[DIAGNOSTICS_KEY]) ? stored[DIAGNOSTICS_KEY] : [];
    history.push({ message: String(error?.message || error).slice(0, 240), at: new Date().toISOString() });
    await chrome.storage.local.set({ [DIAGNOSTICS_KEY]: history.slice(-50) });
  } catch {
    // Diagnostics must never interfere with browser operation.
  }
}

async function refreshWorkspaceMenus(workspaces) {
  if (!chrome.contextMenus) return;
  if (!workspaces) workspaces = await readWorkspaces();
  const storedPreferences = await chrome.storage.local.get(FEATURE_SETTINGS_KEY);
  if (storedPreferences[FEATURE_SETTINGS_KEY]?.contextMenuEnabled === false) {
    await chrome.contextMenus.removeAll().catch(() => {});
    return;
  }
  const items = await chrome.contextMenus.removeAll().catch(() => {});
  void items;
  chrome.contextMenus.create({ id: "startpage-root", title: "Startpage tools", contexts: ["all"] });
  chrome.contextMenus.create({ id: "startpage-open-palette", parentId: "startpage-root", title: "Open command palette", contexts: ["all"] });
  chrome.contextMenus.create({ id: "startpage-save-link", parentId: "startpage-root", title: "Save link for later", contexts: ["link"] });
  chrome.contextMenus.create({ id: "startpage-search-selection", parentId: "startpage-root", title: "Search selected text", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "startpage-note-selection", parentId: "startpage-root", title: "Add selection to quick notes", contexts: ["selection"] });
  if (workspaces.length) {
    chrome.contextMenus.create({ id: "startpage-workspaces", parentId: "startpage-root", title: "Open in workspace", contexts: ["link"] });
    workspaces.slice(0, 15).forEach((workspace) => chrome.contextMenus.create({
      id: `startpage-workspace-${workspace.id}`,
      parentId: "startpage-workspaces",
      title: workspace.name,
      contexts: ["link"],
    }));
  }
}

async function openPalette() {
  const url = chrome.runtime.getURL("command-palette.html");
  const tabs = await chrome.tabs.query({ url });
  if (tabs[0]?.id) return chrome.tabs.update(tabs[0].id, { active: true });
  return chrome.tabs.create({ url, active: true });
}

self.addEventListener("unhandledrejection", (event) => recordDiagnosticError(event.reason));
self.addEventListener("error", (event) => recordDiagnosticError(event.error || event.message));

chrome.runtime.onInstalled.addListener(() => {
  refreshWorkspaceMenus().catch(recordDiagnosticError);
  chrome.alarms.create("browser-focus-check", { periodInMinutes: 1 });
  evaluateFocus().catch(recordDiagnosticError);
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("browser-focus-check", { periodInMinutes: 1 });
  evaluateFocus().catch(recordDiagnosticError);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "browser-focus-check") evaluateFocus().catch(recordDiagnosticError);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[FOCUS_KEY]) evaluateFocus().catch(recordDiagnosticError);
  // Workspace menu refreshes are handled by writeWorkspaces to avoid duplicate remove/create races.
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    chrome.tabs.sendMessage(tabId, { type: "browser-focus-refresh" }).catch(() => {});
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "open-command-palette") openPalette().catch(recordDiagnosticError);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === "startpage-open-palette") return openPalette();
    if (info.menuItemId === "startpage-save-link" && info.linkUrl) {
      const stored = await chrome.storage.local.get("savedBrowserLinks");
      const links = Array.isArray(stored.savedBrowserLinks) ? stored.savedBrowserLinks : [];
      if (!links.some((link) => link.url === info.linkUrl)) links.unshift({ url: info.linkUrl, title: info.selectionText || info.linkUrl, savedAt: new Date().toISOString() });
      await chrome.storage.local.set({ savedBrowserLinks: links.slice(0, 100) });
      return;
    }
    if (info.menuItemId === "startpage-search-selection" && info.selectionText) {
      const query = encodeURIComponent(info.selectionText.slice(0, 500));
      return chrome.tabs.create({ url: `https://www.google.com/search?q=${query}` });
    }
    if (info.menuItemId === "startpage-note-selection" && info.selectionText) {
      const stored = await chrome.storage.local.get(NOTES_KEY);
      const previous = typeof stored[NOTES_KEY] === "string" ? stored[NOTES_KEY] : "";
      const note = info.selectionText.trim().slice(0, 1000);
      await chrome.storage.local.set({ [NOTES_KEY]: [previous, note].filter(Boolean).join("\n\n") });
      return;
    }
    if (typeof info.menuItemId === "string" && info.menuItemId.startsWith("startpage-workspace-") && info.linkUrl) {
      const id = info.menuItemId.slice("startpage-workspace-".length);
      const workspaces = await readWorkspaces();
      const workspace = workspaces.find((item) => item.id === id);
      if (!workspace) return;
      await chrome.tabs.create({ url: info.linkUrl, active: true });
    }
  } catch (error) {
    recordDiagnosticError(error);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type?.startsWith("browser-tools-")) return false;
  (async () => {
    switch (message.type) {
      case "browser-tools-open-dashboard":
        await chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html"), active: true });
        return { ok: true };
      case "browser-tools-open-shortcut-settings":
        await chrome.tabs.create({ url: "chrome://extensions/shortcuts", active: true });
        return { ok: true };
      case "browser-tools-workspaces-get": {
        const stored = await chrome.storage.local.get(FEATURE_SETTINGS_KEY);
        return { ok: true, workspaces: await readWorkspaces(), defaultWorkspaceId: stored[FEATURE_SETTINGS_KEY]?.defaultWorkspaceId || "" };
      }
      case "browser-tools-workspace-save":
        return saveWorkspace(message.name);
      case "browser-tools-workspace-restore":
        return restoreWorkspace(String(message.id || ""));
      case "browser-tools-workspace-duplicate":
        return duplicateWorkspace(String(message.id || ""));
      case "browser-tools-workspace-delete":
        return deleteWorkspace(String(message.id || ""));
      case "browser-tools-workspace-rename":
        return renameWorkspace(String(message.id || ""), message.name);
      case "browser-tools-focus-get":
        return { ok: true, ...(await evaluateFocus()) };
      case "browser-tools-focus-set":
        return { ok: true, settings: await writeFocusSettings(message.settings) };
      case "browser-tools-focus-toggle": {
        const settings = await readFocusSettings();
        return { ok: true, settings: await writeFocusSettings({ ...settings, enabled: !settings.enabled }) };
      }
      case "browser-tools-focus-pause": {
        await chrome.storage.local.set({ focusOverrideUntil: Date.now() + 15 * 60 * 1000 });
        const state = await evaluateFocus();
        return { ok: true, runtime: state.runtime };
      }
      case "browser-tools-diagnostics":
        return { ok: true, diagnostics: await getDiagnostics() };
      case "browser-tools-settings-get": {
        const stored = await chrome.storage.local.get(FEATURE_SETTINGS_KEY);
        return { ok: true, settings: { ...featureDefaults, ...(stored[FEATURE_SETTINGS_KEY] || {}) } };
      }
      case "browser-tools-settings-set": {
        const stored = await chrome.storage.local.get(FEATURE_SETTINGS_KEY);
        const settings = { ...featureDefaults, ...(stored[FEATURE_SETTINGS_KEY] || {}), ...(message.settings || {}) };
        await chrome.storage.local.set({ [FEATURE_SETTINGS_KEY]: settings });
        await refreshWorkspaceMenus();
        return { ok: true, settings };
      }
      case "browser-tools-focus-close-tab":
        if (sender.tab?.id) await chrome.tabs.remove(sender.tab.id);
        return { ok: true };
      case "browser-tools-saved-links": {
        const stored = await chrome.storage.local.get("savedBrowserLinks");
        return { ok: true, links: Array.isArray(stored.savedBrowserLinks) ? stored.savedBrowserLinks : [] };
      }
      case "browser-tools-notes-get": {
        const stored = await chrome.storage.local.get(NOTES_KEY);
        return { ok: true, notes: stored[NOTES_KEY] || "" };
      }
      case "browser-tools-notes-set":
        await chrome.storage.local.set({ [NOTES_KEY]: String(message.notes || "").slice(0, 20000) });
        return { ok: true };
      default:
        return { ok: false, error: "Unknown browser-tools action." };
    }
  })().then(sendResponse).catch((error) => {
    recordDiagnosticError(error);
    sendResponse({ ok: false, error: error.message || "The browser action failed." });
  });
  return true;
});
