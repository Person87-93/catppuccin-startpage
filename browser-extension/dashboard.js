const $ = (selector) => document.querySelector(selector);
const send = (type, extra = {}) => chrome.runtime.sendMessage({ type: `browser-tools-${type}`, ...extra });
const status = $("#dashboard-status");

function setStatus(message) { status.textContent = message; }

async function loadWorkspaces() {
  const response = await send("workspaces-get");
  const workspaces = response?.workspaces || [];
  $("#workspace-count").textContent = `${workspaces.length} saved`;
  const list = $("#workspace-list");
  list.replaceChildren();
  if (!workspaces.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "no workspaces saved yet";
    list.append(empty);
    return;
  }
  workspaces.forEach((workspace) => {
    const row = document.createElement("article");
    row.className = "workspace-row";
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = workspace.name;
    const detail = document.createElement("small");
    detail.textContent = `${workspace.tabs?.length || 0} tabs · updated ${new Date(workspace.updatedAt).toLocaleDateString()}`;
    info.append(title, detail);
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const restore = document.createElement("button");
    restore.className = "primary";
    restore.textContent = "restore";
    restore.addEventListener("click", async () => {
      const result = await send("workspace-restore", { id: workspace.id });
      setStatus(result?.ok ? `opened ${result.opened} missing tabs; existing tabs were left alone.` : result?.error || "could not restore workspace");
    });
    const duplicate = document.createElement("button");
    duplicate.textContent = "duplicate";
    duplicate.addEventListener("click", async () => {
      const result = await send("workspace-duplicate", { id: workspace.id });
      setStatus(result?.ok ? `created "${result.workspace.name}".` : result?.error || "could not duplicate workspace");
      loadWorkspaces();
    });
    const rename = document.createElement("button");
    rename.textContent = "rename";
    rename.addEventListener("click", async () => {
      const name = window.prompt("Rename workspace", workspace.name);
      if (!name) return;
      const result = await send("workspace-rename", { id: workspace.id, name });
      setStatus(result?.ok ? "workspace renamed." : result?.error || "could not rename workspace");
      loadWorkspaces();
    });
    const remove = document.createElement("button");
    remove.className = "danger";
    remove.textContent = "delete";
    remove.addEventListener("click", async () => {
      if (!window.confirm(`Delete the saved workspace "${workspace.name}"? This will not close any tabs.`)) return;
      await send("workspace-delete", { id: workspace.id });
      setStatus("workspace deleted.");
      loadWorkspaces();
    });
    actions.append(restore, duplicate, rename, remove);
    row.append(info, actions);
    list.append(row);
  });
}

async function loadFocus() {
  const result = await send("focus-get");
  const settings = result?.settings || {};
  $("#focus-enabled").checked = settings.enabled === true;
  $("#focus-sites").value = (settings.sites || []).join("\n");
  $("#schedule-enabled").checked = settings.schedule?.enabled === true;
  $("#schedule-start").value = settings.schedule?.start || "09:00";
  $("#schedule-end").value = settings.schedule?.end || "17:00";
  $("#day-picker").querySelectorAll("input").forEach((input) => {
    input.checked = (settings.schedule?.days || []).includes(Number(input.value));
  });
  $("#focus-status").textContent = result?.runtime?.active ? "active" : "off";
  $("#focus-status").classList.toggle("active", Boolean(result?.runtime?.active));
}

async function saveFocus() {
  const settings = {
    enabled: $("#focus-enabled").checked,
    sites: $("#focus-sites").value.split("\n").map((site) => site.trim()).filter(Boolean),
    schedule: {
      enabled: $("#schedule-enabled").checked,
      start: $("#schedule-start").value,
      end: $("#schedule-end").value,
      days: [...$("#day-picker").querySelectorAll("input:checked")].map((input) => Number(input.value)),
    },
  };
  const result = await send("focus-set", { settings });
  if (!result?.ok) return setStatus(result?.error || "could not save focus settings");
  setStatus("focus settings saved.");
  loadFocus();
}

async function loadDiagnostics() {
  const result = await send("diagnostics");
  if (!result?.ok) return;
  const data = result.diagnostics;
  const metrics = [
    ["extension", data.extensionVersion],
    ["open tabs", data.totalTabs],
    ["duplicate tabs", data.duplicateTabCount],
    ["website tabs", data.regularTabs],
    ["saved workspaces", data.workspaceCount],
    ["saved workspace tabs", data.workspaceTabCount],
    ["tab groups", data.tabGroupCount],
    ["focus mode", data.focusActive ? "active" : "off"],
    ["focus websites", data.focusSiteCount],
    ["extension storage", `${(data.extensionStorageBytes / 1024).toFixed(1)} KB`],
    ["active page load", data.pagePerformance?.loadCompleteMs ? `${data.pagePerformance.loadCompleteMs} ms` : "unavailable"],
  ];
  const grid = $("#diagnostics-grid");
  grid.replaceChildren();
  metrics.forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "metric";
    const strong = document.createElement("strong");
    strong.textContent = value;
    const small = document.createElement("small");
    small.textContent = label;
    card.append(strong, small);
    grid.append(card);
  });
  const errors = $("#diagnostic-errors");
  errors.replaceChildren();
  if (data.pagePerformance) {
    const timing = document.createElement("p");
    timing.className = "hint";
    timing.textContent = `active page: DOM interactive ${data.pagePerformance.domInteractiveMs} ms · transferred ${(data.pagePerformance.transferBytes / 1024).toFixed(1)} KB`;
    errors.append(timing);
  }
  if (!data.recentErrors.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "no recorded extension errors";
    errors.append(empty);
  } else {
    data.recentErrors.slice().reverse().forEach((entry) => {
      const row = document.createElement("p");
      row.textContent = `${new Date(entry.at).toLocaleString()} · ${entry.message}`;
      errors.append(row);
    });
  }
}

$("#workspace-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = $("#workspace-name").value.trim();
  const result = await send("workspace-save", { name });
  if (!result?.ok) return setStatus(result?.error || "could not save workspace");
  $("#workspace-name").value = "";
  setStatus(`saved ${result.count} tabs to "${result.workspace.name}".`);
  loadWorkspaces();
});
$("#save-focus").addEventListener("click", saveFocus);
$("#refresh-diagnostics").addEventListener("click", loadDiagnostics);

Promise.all([loadWorkspaces(), loadFocus(), loadDiagnostics()]).catch((error) => setStatus(error.message || "dashboard could not load"));
if (location.hash === "#diagnostics") $("#diagnostics").scrollIntoView();


$("#enable-notifications").addEventListener("click", async () => {
  try {
    const granted = await chrome.permissions.request({ permissions: ["notifications"] });
    if (!granted) return setStatus("notification permission was not granted.");
    const current = await send("settings-get");
    await send("settings-set", { settings: { ...(current.settings || {}), browserNotifications: true } });
    setStatus("browser notifications are enabled.");
  } catch (error) {
    setStatus(error.message || "could not request notification permission.");
  }
});


$("#pause-focus").addEventListener("click", async () => {
  const result = await send("focus-pause");
  setStatus(result?.ok ? "focus mode paused for 15 minutes." : result?.error || "could not pause focus mode.");
  loadFocus();
});


const sendUpdate = (type, extra = {}) => chrome.runtime.sendMessage({ type: \`browser-updates-\${type}\`, ...extra });

function renderSources(sources) {
  const list = $("#source-list");
  list.replaceChildren();
  $("#source-count").textContent = \`\${sources.length} sources\`;
  if (!sources.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "no sources configured yet";
    list.append(empty);
    return;
  }
  sources.forEach(source => {
    const row = document.createElement("article");
    row.className = "workspace-row source-row";
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = source.name;
    const detail = document.createElement("small");
    detail.textContent = \`\${source.category} · \${source.type.toUpperCase()}\${source.lastError ? " · " + source.lastError : ""}\`;
    info.append(title, detail);
    const actions = document.createElement("div");
    actions.className = "row-actions";
    const toggle = document.createElement("button");
    toggle.textContent = source.enabled ? "enabled" : "disabled";
    toggle.className = source.enabled ? "quiet" : "";
    toggle.addEventListener("click", async () => {
      const result = await sendUpdate("source-toggle", { id: source.id, enabled: !source.enabled });
      if (!result?.ok) return setStatus(result?.error || "could not update source");
      renderSources(result.sources || []);
    });
    const remove = document.createElement("button");
    remove.className = "danger";
    remove.textContent = "remove";
    remove.addEventListener("click", async () => {
      if (!window.confirm(\`Remove "\${source.name}" from the update sources?\`)) return;
      const result = await sendUpdate("source-remove", { id: source.id });
      if (!result?.ok) return setStatus(result?.error || "could not remove source");
      renderSources(result.sources || []);
    });
    actions.append(toggle, remove);
    row.append(info, actions);
    list.append(row);
  });
}

function renderUpdates(updates) {
  const list = $("#update-list");
  list.replaceChildren();
  if (!updates.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "no matching updates yet. try collecting now or enabling another source.";
    list.append(empty);
    return;
  }
  updates.slice(0, 60).forEach(item => {
    const row = document.createElement("article");
    row.className = "update-entry";
    const meta = document.createElement("small");
    meta.textContent = \`\${item.category} · \${item.source}\`;
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = item.title;
    const summary = document.createElement("p");
    summary.textContent = item.summary || "open the original source for details.";
    const date = document.createElement("small");
    const timestamp = item.publishedAt || item.discoveredAt;
    date.textContent = timestamp ? new Date(timestamp).toLocaleString() : "date not provided by source";
    row.append(meta, link, summary, date);
    list.append(row);
  });
}

async function loadUpdateCenter() {
  const settings = await send("settings-get");
  if (!settings?.ok) throw new Error(settings?.error || "could not load update settings");
  $("#update-api-url").value = settings.settings.updateApiUrl || "";
  $("#update-api-key").value = settings.settings.updateApiKey || "";
  if (!$("#update-api-url").value || !$("#update-api-key").value) {
    $("#update-status").textContent = "not connected";
    $("#update-connection-help").textContent = "Paste your deployed Apps Script /exec URL and API key, then save the connection.";
    return;
  }
  await loadUpdates();
}

async function loadUpdates() {
  $("#update-status").textContent = "connecting";
  const result = await sendUpdate("feed-get");
  if (!result?.ok) {
    $("#update-status").textContent = "connection issue";
    $("#update-connection-help").textContent = result?.error || "Could not reach the Apps Script endpoint.";
    setStatus(result?.error || "could not load updates");
    return;
  }
  $("#update-status").textContent = "connected";
  $("#update-connection-help").textContent = "Connected to your Google Apps Script collector. It runs on its own six-hour schedule.";
  $("#update-last-run").textContent = result.lastRun ? \`last collection: \${new Date(result.lastRun).toLocaleString()}\` : "waiting for first collection";
  renderSources(result.sources || []);
  renderUpdates(result.updates || []);
}

$("#save-update-connection").addEventListener("click", async () => {
  const current = await send("settings-get");
  const settings = {
    ...(current.settings || {}),
    updateApiUrl: $("#update-api-url").value.trim(),
    updateApiKey: $("#update-api-key").value.trim(),
  };
  const saved = await send("settings-set", { settings });
  if (!saved?.ok) return setStatus(saved?.error || "could not save update connection");
  setStatus("update connection saved.");
  await loadUpdates();
});

$("#collect-updates-now").addEventListener("click", async () => {
  $("#update-status").textContent = "collecting";
  const result = await sendUpdate("collect-now");
  if (!result?.ok) {
    $("#update-status").textContent = "connection issue";
    return setStatus(result?.error || "collection failed");
  }
  setStatus("collection completed.");
  await loadUpdates();
});

$("#source-form").addEventListener("submit", async event => {
  event.preventDefault();
  const source = {
    name: $("#source-name").value.trim(),
    category: $("#source-category").value,
    type: $("#source-type").value,
    url: $("#source-url").value.trim(),
    pathPrefix: $("#source-prefix").value.trim(),
  };
  const result = await sendUpdate("source-add", { source });
  if (!result?.ok) return setStatus(result?.error || "could not add source");
  $("#source-name").value = "";
  $("#source-url").value = "";
  $("#source-prefix").value = "";
  renderSources(result.sources || []);
  setStatus("source added.");
});

$("#source-type").addEventListener("change", () => {
  $("#source-prefix").placeholder = $("#source-type").value === "html" ? "required HTML path prefix, e.g. /news/" : "optional for RSS";
});

loadUpdateCenter().catch(error => {
  $("#update-status").textContent = "not connected";
  setStatus(error.message || "update center could not load");
});
