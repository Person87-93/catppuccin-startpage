const search = document.querySelector("#command-search");
const results = document.querySelector("#command-results");
let commands = [];
let selected = 0;

function send(type, extra = {}) {
  return chrome.runtime.sendMessage({ type: `browser-tools-${type}`, ...extra });
}

async function loadCommands() {
  const [workspaceResult, savedResult, openTabs, settingsResult] = await Promise.all([
    send("workspaces-get"),
    send("saved-links"),
    chrome.tabs.query({}),
    send("settings-get"),
  ]);
  commands = [
    { id: "dashboard", title: "Open browser dashboard", detail: "Workspaces, focus mode, and diagnostics", run: () => chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") }) },
    { id: "save-workspace", title: "Save current tabs as a workspace", detail: "Capture regular website tabs in this window", run: async () => {
      const name = window.prompt("Name this workspace");
      if (name) await send("workspace-save", { name });
    } },
    { id: "focus-toggle", title: "Toggle focus mode", detail: "Turn your focus profile on or off", run: () => send("focus-toggle") },
    { id: "focus-pause", title: "Pause focus mode for 15 minutes", detail: "Temporarily override manual and scheduled focus", run: () => send("focus-pause") },
    ...((workspaceResult?.workspaces || []).filter((item) => item.id === settingsResult?.settings?.defaultWorkspaceId).map((workspace) => ({ id: "default-workspace", title: `Restore default workspace: ${workspace.name}`, detail: `${workspace.tabs?.length || 0} saved tabs`, run: () => send("workspace-restore", { id: workspace.id }) }))),
    { id: "diagnostics", title: "View browser diagnostics", detail: "Tab counts, storage, workspaces, and extension status", run: () => chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html#diagnostics") }) },
    ...(workspaceResult?.workspaces || []).map((workspace) => ({
      id: `workspace-${workspace.id}`,
      title: `Restore workspace: ${workspace.name}`,
      detail: `${workspace.tabs?.length || 0} saved tabs · opens missing tabs without closing anything`,
      run: () => send("workspace-restore", { id: workspace.id }),
    })),
    ...openTabs.filter((tab) => tab.id && tab.url).map((tab) => ({
      id: `tab-${tab.id}`,
      title: `Switch to tab: ${tab.title || tab.url}`,
      detail: tab.url,
      run: async () => {
        await chrome.tabs.update(tab.id, { active: true });
      },
    })),
    ...(savedResult?.links || []).map((link, index) => ({
      id: `saved-${index}`,
      title: `Open saved link: ${link.title || link.url}`,
      detail: link.url,
      run: () => chrome.tabs.create({ url: link.url }),
    })),
  ];
  render();
}

function render() {
  const query = search.value.trim().toLowerCase();
  const filtered = commands.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(query));
  selected = Math.min(selected, Math.max(0, filtered.length - 1));
  results.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "no matching commands";
    results.append(empty);
    return;
  }
  filtered.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = `command-row${index === selected ? " selected" : ""}`;
    button.type = "button";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(index === selected));
    const title = document.createElement("strong");
    title.textContent = item.title;
    const detail = document.createElement("small");
    detail.textContent = item.detail;
    button.append(title, detail);
    button.addEventListener("click", () => run(item));
    results.append(button);
  });
}

async function run(item) {
  try {
    await item.run();
    if (item.id !== "dashboard") window.close();
  } catch (error) {
    const message = document.createElement("p");
    message.className = "empty";
    message.textContent = error.message || "could not run that command";
    results.prepend(message);
  }
}

search.addEventListener("input", () => { selected = 0; render(); });
search.addEventListener("keydown", (event) => {
  const query = search.value.trim().toLowerCase();
  const filtered = commands.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(query));
  if ((event.key === "ArrowDown" || event.key === "ArrowUp") && filtered.length) {
    event.preventDefault();
    selected = (selected + (event.key === "ArrowDown" ? 1 : -1) + filtered.length) % filtered.length;
    render();
  } else if (event.key === "Enter" && filtered[selected]) {
    event.preventDefault();
    run(filtered[selected]);
  } else if (event.key === "Escape") {
    window.close();
  }
});
loadCommands().catch((error) => {
  results.textContent = error.message || "could not load commands";
});
