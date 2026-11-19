const pickButton = document.querySelector("#pick");
const siteLabel = document.querySelector("#site");
const itemsList = document.querySelector("#items");
const restoreSiteButton = document.querySelector("#restore-site");
const restoreEverywhereButton = document.querySelector("#restore-everywhere");
const status = document.querySelector("#status");

function send(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      const error = chrome.runtime.lastError?.message;
      if (error) reject(new Error(error));
      else resolve(response);
    });
  });
}

function renderSite({ host, selectors, hasAnyRules }) {
  siteLabel.textContent = host || "No supported website is active";
  itemsList.replaceChildren();
  (selectors || []).forEach((selector) => {
    const row = document.createElement("li");
    const label = document.createElement("span");
    label.className = "selector";
    label.textContent = selector;
    const button = document.createElement("button");
    button.className = "restore-one";
    button.type = "button";
    button.textContent = "Restore";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const result = await send({ type: "startpage-element-hiding-active-site-remove", selector });
        if (!result?.ok) throw new Error(result?.error || "Could not restore this item.");
        await refreshSite();
        status.textContent = "Element restored.";
      } catch (error) {
        status.textContent = error.message;
        button.disabled = false;
      }
    });
    row.append(label, button);
    itemsList.append(row);
  });
  const hasRules = Boolean(selectors?.length);
  restoreSiteButton.hidden = !hasRules;
  restoreEverywhereButton.hidden = !hasAnyRules;
  if (!hasRules && host) status.textContent = "No hidden elements saved for this site.";
}

async function refreshSite() {
  const result = await send({ type: "startpage-element-hiding-active-site-get" });
  renderSite(result || { host: "", selectors: [], hasAnyRules: false });
}

pickButton.addEventListener("click", async () => {
  pickButton.disabled = true;
  status.textContent = "Turning on the picker…";
  try {
    const response = await send({ type: "startpage-site-picker-toggle-active-tab" });
    if (!response?.ok) throw new Error(response?.error || "Could not start the picker on this page.");
    status.textContent = "Picker is on. Click an element on the page to hide it.";
    window.setTimeout(() => window.close(), 700);
  } catch (error) {
    status.textContent = error.message;
    pickButton.disabled = false;
  }
});

restoreSiteButton.addEventListener("click", async () => {
  restoreSiteButton.disabled = true;
  try {
    const response = await send({ type: "startpage-element-hiding-active-site-clear" });
    if (!response?.ok) throw new Error(response?.error || "Could not restore this site.");
    await refreshSite();
    status.textContent = "All hidden elements on this site have been restored.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    restoreSiteButton.disabled = false;
  }
});

restoreEverywhereButton.addEventListener("click", async () => {
  restoreEverywhereButton.disabled = true;
  try {
    const response = await send({ type: "startpage-element-hiding-clear-all" });
    if (!response?.ok) throw new Error(response?.error || "Could not restore hidden elements.");
    await refreshSite();
    status.textContent = "All hidden elements on every site have been restored.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    restoreEverywhereButton.disabled = false;
  }
});

refreshSite().catch((error) => {
  siteLabel.textContent = "Could not read this site";
  status.textContent = error.message;
});
