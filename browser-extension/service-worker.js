importScripts("browser-tools.js");

const trustedStartpage = (url) => {
  try {
    const parsed = new URL(url);
    return (parsed.hostname === "person87-93.github.io" && parsed.pathname.startsWith("/catppuccin-startpage"))
      || (parsed.hostname === "localhost" && parsed.port === "8000");
  } catch {
    return false;
  }
};

function readMediaFromPage() {
  const elements = Array.from(document.querySelectorAll("audio, video"));
  const metadata = navigator.mediaSession?.metadata;
  return elements.flatMap((element, mediaIndex) => {
    const src = element.currentSrc || element.src || "";
    if (!src) return [];
    return [{
      mediaIndex,
      src,
      title: metadata?.title || document.title || "Media",
      artist: metadata?.artist || "",
      album: metadata?.album || "",
      host: location.hostname,
      tabTitle: document.title || location.hostname,
      playing: !element.paused && !element.ended,
      currentTime: Number(element.currentTime) || 0,
      duration: Number.isFinite(element.duration) ? element.duration : 0,
      volume: element.muted ? 0 : element.volume,
      seekable: Number.isFinite(element.duration) && element.duration > 0,
    }];
  });
}

async function controlMedia(action, value, mediaIndex, expectedSrc) {
  const elements = Array.from(document.querySelectorAll("audio, video"));
  let element = elements[mediaIndex];

  // A site's media elements can be replaced or reordered after discovery.
  // Verify the selected source before controlling it, then resolve it again by URL.
  if (expectedSrc && (!element || (element.currentSrc || element.src || "") !== expectedSrc)) {
    element = elements.find((candidate) => (candidate.currentSrc || candidate.src || "") === expectedSrc);
  }
  if (!element) return { ok: false, error: "The selected media player is no longer available. Refresh the music panel and select it again." };

  if (action === "play") {
    try {
      await element.play();
    } catch {
      return { ok: false, error: "The website blocked playback. Start it from the media tab first." };
    }
  } else if (action === "pause") {
    element.pause();
    if (!element.paused) return { ok: false, error: "The website did not allow this media to pause." };
  } else if (action === "toggle") {
    if (element.paused) {
      try { await element.play(); }
      catch { return { ok: false, error: "The website blocked playback. Start it from the media tab first." }; }
    } else {
      element.pause();
      if (!element.paused) return { ok: false, error: "The website did not allow this media to pause." };
    }
  } else if (action === "seek" && Number.isFinite(element.duration)) {
    element.currentTime = Math.min(element.duration, Math.max(0, Number(value)));
  } else if (action === "volume") {
    element.muted = false;
    element.volume = Math.min(1, Math.max(0, Number(value)));
  } else {
    return { ok: false, error: "That media action is not supported." };
  }

  return {
    ok: true,
    media: {
      playing: !element.paused && !element.ended,
      currentTime: Number(element.currentTime) || 0,
      duration: Number.isFinite(element.duration) ? element.duration : 0,
      volume: element.muted ? 0 : element.volume,
      seekable: Number.isFinite(element.duration) && element.duration > 0,
    },
  };
}

async function findMediaSources(sourceTabId) {
  const tabs = await chrome.tabs.query({});
  const found = [];
  await Promise.all(tabs.filter((tab) => tab.id !== sourceTabId).map(async (tab) => {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: readMediaFromPage,
      });
      results.forEach(({ frameId, result }) => {
        if (!Array.isArray(result)) return;
        result.forEach((media) => found.push({ tabId: tab.id, frameId, ...media }));
      });
    } catch {
      // Some browser pages and sites without granted access cannot be inspected.
    }
  }));

  found.sort((a, b) => Number(b.playing) - Number(a.playing));
  return found.slice(0, 20);
}

const websiteDefaults = {
  enabled: false,
  background: "#1e1e2e",
  text: "#cdd6f4",
  accent: "#89b4fa",
  border: "#45475a",
  opacity: 94,
  blur: 0,
  font: "system",
  spacing: "normal",
};

const hidingDefaults = { enabled: false, hiddenElementsByHost: {} };

function safeColour(value, fallback) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function safeRules(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const rules = {};
  Object.entries(value).slice(0, 100).forEach(([host, selectors]) => {
    const normalHost = String(host).toLowerCase();
    try {
      if (new URL(`https://${normalHost}`).hostname !== normalHost || !Array.isArray(selectors)) return;
    } catch {
      return;
    }
    const validSelectors = [...new Set(selectors.filter((selector) => typeof selector === "string" && selector.trim() && selector.length <= 512 && !/[{};@\n\r]/.test(selector) && !selector.includes("/*") && !selector.includes("*/")).map((selector) => selector.trim()))].slice(0, 50);
    if (validSelectors.length) rules[normalHost] = validSelectors;
  });
  return rules;
}

function safeWebsiteSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    enabled: source.enabled === true,
    background: safeColour(source.background, websiteDefaults.background),
    text: safeColour(source.text, websiteDefaults.text),
    accent: safeColour(source.accent, websiteDefaults.accent),
    border: safeColour(source.border, websiteDefaults.border),
    opacity: Math.max(55, Math.min(100, Number(source.opacity) || websiteDefaults.opacity)),
    blur: Math.max(0, Math.min(16, Number(source.blur) || 0)),
    font: ["system", "arial", "roboto", "georgia"].includes(source.font) ? source.font : "system",
    spacing: ["compact", "normal", "comfortable"].includes(source.spacing) ? source.spacing : "normal",
  };
}

function safeHidingSettings(input) {
  const source = input && typeof input === "object" ? input : {};
  return { enabled: source.enabled === true, hiddenElementsByHost: safeRules(source.hiddenElementsByHost) };
}

function websiteCss(input) {
  const settings = safeWebsiteSettings(input);
  if (!settings.enabled) return "";
  const fonts = { system: "system-ui, sans-serif", arial: "Arial, sans-serif", roboto: "Roboto, Arial, sans-serif", georgia: "Georgia, serif" };
  const spacing = { compact: 1.35, normal: 1.55, comfortable: 1.75 };
  const [red, green, blue] = settings.background.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
  const scheme = (red * 0.2126 + green * 0.7152 + blue * 0.0722) < 0.5 ? "dark" : "light";
  return `
    html { color-scheme: ${scheme} !important; --startpage-site-background: ${settings.background}; --startpage-site-text: ${settings.text}; --startpage-site-accent: ${settings.accent}; --startpage-site-border: ${settings.border}; --startpage-site-opacity: ${settings.opacity}%; --startpage-site-blur: ${settings.blur}px; --startpage-site-font: ${fonts[settings.font]}; --startpage-site-line-height: ${spacing[settings.spacing]}; }
    html, body { background-color: var(--startpage-site-background) !important; color: var(--startpage-site-text) !important; }
    body, body button, body input, body textarea, body select { font-family: var(--startpage-site-font) !important; line-height: var(--startpage-site-line-height) !important; }
    body :where(p, h1, h2, h3, h4, h5, h6, li, td, th, label, summary, blockquote, figcaption) { color: var(--startpage-site-text) !important; }
    body :where(a, [role="link"]) { color: var(--startpage-site-accent) !important; }
    body :where(button, input:not([type="checkbox"]):not([type="radio"]), textarea, select, [role="button"]) { color: var(--startpage-site-text) !important; border-color: var(--startpage-site-border) !important; background-color: color-mix(in srgb, var(--startpage-site-background) var(--startpage-site-opacity), transparent) !important; }
    body :where(fieldset, hr, [role="separator"]) { border-color: var(--startpage-site-border) !important; }
    body :where(main, [role="main"], article, aside, nav, header, footer, dialog) { border-color: var(--startpage-site-border) !important; background-color: color-mix(in srgb, var(--startpage-site-background) var(--startpage-site-opacity), transparent) !important; backdrop-filter: blur(var(--startpage-site-blur)) !important; }
  `;
}

function hidingCss(input, host) {
  const settings = safeHidingSettings(input);
  if (!settings.enabled) return "";
  return (settings.hiddenElementsByHost[host] || []).map((selector) => `:is(${selector}) { display: none !important; }`).join("\n");
}

const pickerCss = `
  [data-startpage-picker-hover] { outline: 3px solid #89b4fa !important; outline-offset: 2px !important; cursor: crosshair !important; }
  #startpage-picker-notice { position: fixed !important; z-index: 2147483647 !important; top: 12px !important; right: 12px !important; max-width: min(360px, calc(100vw - 24px)) !important; padding: 10px 14px !important; border: 1px solid #45475a !important; border-radius: 10px !important; background: #1e1e2e !important; color: #cdd6f4 !important; font: 14px/1.4 system-ui, sans-serif !important; box-shadow: 0 8px 30px #0008 !important; pointer-events: none !important; }
`;

async function updateTabAppearance(tabId, url, oldAppearance, newAppearance, oldHiding = null, newHiding = null) {
  let host;
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return;
    host = parsed.hostname.toLowerCase();
  } catch {
    return;
  }
  const styles = [
    [websiteCss(oldAppearance), websiteCss(newAppearance)],
    [hidingCss(oldHiding, host), hidingCss(newHiding, host)],
  ];
  for (const [oldCss, newCss] of styles) {
    try {
      if (oldCss) await chrome.scripting.removeCSS({ target: { tabId }, css: oldCss, origin: "USER" });
    } catch {
      // The stylesheet may not have been injected in this document yet.
    }
    if (newCss) {
      try {
        await chrome.scripting.insertCSS({ target: { tabId }, css: newCss, origin: "USER" });
      } catch {
        // Browser-internal, protected, or navigated pages cannot always be styled.
      }
    }
  }
}

async function updateOpenTabs(oldAppearance, newAppearance, oldHiding = hidingDefaults, newHiding = hidingDefaults) {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.filter((tab) => tab.id && tab.url).map((tab) => updateTabAppearance(tab.id, tab.url, oldAppearance, newAppearance, oldHiding, newHiding)));
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (changes.websiteAppearance || changes.elementHiding) {
    chrome.storage.local.get(["websiteAppearance", "elementHiding"]).then((stored) => updateOpenTabs(
      changes.websiteAppearance?.oldValue || stored.websiteAppearance || websiteDefaults,
      changes.websiteAppearance?.newValue || stored.websiteAppearance || websiteDefaults,
      changes.elementHiding?.oldValue || stored.elementHiding || hidingDefaults,
      changes.elementHiding?.newValue || stored.elementHiding || hidingDefaults,
    )).catch(() => {});
  }
});

async function saveWebsiteSettings(input) {
  const settings = safeWebsiteSettings(input);
  await chrome.storage.local.set({ websiteAppearance: settings });
  return settings;
}

async function loadHidingSettings() {
  const stored = await chrome.storage.local.get(["elementHiding", "websiteAppearance"]);
  if (stored.elementHiding) return safeHidingSettings(stored.elementHiding);
  const legacy = safeHidingSettings({ enabled: Boolean(Object.keys(stored.websiteAppearance?.hiddenElementsByHost || {}).length), hiddenElementsByHost: stored.websiteAppearance?.hiddenElementsByHost });
  if (legacy.enabled) await chrome.storage.local.set({ elementHiding: legacy });
  return legacy;
}

async function saveHidingSettings(input) {
  const settings = safeHidingSettings(input);
  let protectedSelectors = [];
  for (const host of ["person87-93.github.io", "localhost"]) {
    const selectors = settings.hiddenElementsByHost[host];
    if (!selectors?.length) continue;
    const tabs = await chrome.tabs.query({});
    const page = tabs.find((tab) => {
      try {
        const url = new URL(tab.url || "");
        return url.hostname.toLowerCase() === host && trustedStartpage(url.href);
      } catch {
        return false;
      }
    });
    if (!page?.id) continue;
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: page.id },
        func: (candidateSelectors) => {
          const recoveryRoot = document.querySelector("tabs-list");
          if (!recoveryRoot) return null;
          const protectedNodes = [];
          for (let node = recoveryRoot; node; node = node.parentElement) protectedNodes.push(node);
          return candidateSelectors.filter((selector) => protectedNodes.some((node) => {
            try { return node.matches(selector); } catch { return true; }
          }));
        },
        args: [selectors],
      });
      if (!Array.isArray(result?.result)) {
        const stored = await chrome.storage.local.get("elementHiding");
        const previous = safeHidingSettings(stored.elementHiding);
        if (previous.hiddenElementsByHost[host]) settings.hiddenElementsByHost[host] = previous.hiddenElementsByHost[host];
        else delete settings.hiddenElementsByHost[host];
        continue;
      }
      protectedSelectors = result.result;
    } catch {
      const stored = await chrome.storage.local.get("elementHiding");
      const previous = safeHidingSettings(stored.elementHiding);
      if (previous.hiddenElementsByHost[host]) settings.hiddenElementsByHost[host] = previous.hiddenElementsByHost[host];
      else delete settings.hiddenElementsByHost[host];
      continue;
    }
    if (protectedSelectors.length) {
      settings.hiddenElementsByHost[host] = selectors.filter((selector) => !protectedSelectors.includes(selector));
      if (!settings.hiddenElementsByHost[host].length) delete settings.hiddenElementsByHost[host];
    }
  }
  await chrome.storage.local.set({ elementHiding: settings });
  return settings;
}

chrome.commands.onCommand.addListener((command) => {
  if (command !== "restore-hidden-elements") return;
  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(async ([tab]) => {
    let host;
    try {
      const url = new URL(tab?.url || "");
      if (!/^https?:$/.test(url.protocol)) return;
      host = url.hostname.toLowerCase();
    } catch {
      return;
    }
    const settings = await loadHidingSettings();
    const removed = (settings.hiddenElementsByHost[host] || []).length;
    delete settings.hiddenElementsByHost[host];
    await saveHidingSettings(settings);
    await chrome.action.setBadgeBackgroundColor({ color: "#a6e3a1", tabId: tab.id });
    await chrome.action.setBadgeText({ text: removed ? "OK" : "—", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }).catch(() => {}), 2500);
  }).catch(() => {});
});

async function addHiddenElement(message, sender) {
  let host;
  try {
    host = new URL(sender.url).hostname.toLowerCase();
  } catch {
    return { ok: false, error: "This page cannot be customised." };
  }
  if (!sender.tab?.id || host !== message.host || typeof message.selector !== "string" || !message.selector.trim() || message.selector.length > 512) {
    return { ok: false, error: "The selected page element was invalid." };
  }
  const hidingSettings = await loadHidingSettings();
  const rules = safeRules(hidingSettings.hiddenElementsByHost);
  const selectors = rules[host] || [];
  if (!selectors.includes(message.selector) && selectors.length < 50) selectors.push(message.selector);
  rules[host] = selectors;
  const settings = safeHidingSettings({ ...hidingSettings, enabled: true, hiddenElementsByHost: rules });
  const saved = await saveHidingSettings(settings);
  if (!(saved.hiddenElementsByHost[host] || []).includes(message.selector)) {
    return { ok: false, error: "That selector would hide the startpage recovery menu, so it was blocked." };
  }
  return { ok: true, settings: saved };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "startpage-site-settings-get" && trustedStartpage(sender.url)) {
    chrome.storage.local.get("websiteAppearance").then(({ websiteAppearance }) => {
      sendResponse({ settings: websiteAppearance || websiteDefaults });
    }).catch(() => sendResponse({ settings: null }));
    return true;
  }

  if (message?.type === "startpage-site-settings" && trustedStartpage(sender.url) && sender.tab?.id) {
    saveWebsiteSettings(message.settings).then(() => sendResponse({ ok: true })).catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (message?.type === "startpage-element-hiding-get" && trustedStartpage(sender.url)) {
    loadHidingSettings().then((settings) => sendResponse({ settings })).catch(() => sendResponse({ settings: hidingDefaults }));
    return true;
  }

  if (message?.type === "startpage-element-hiding-settings" && trustedStartpage(sender.url) && sender.tab?.id) {
    saveHidingSettings(message.settings).then((settings) => sendResponse({ settings })).catch((error) => sendResponse({ error: error.message }));
    return true;
  }

  if (sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`)
      && message?.type === "startpage-element-hiding-active-site-get") {
    Promise.all([chrome.tabs.query({ active: true, lastFocusedWindow: true }), loadHidingSettings()]).then(([tabs, settings]) => {
      let host = "";
      try {
        host = new URL(tabs[0]?.url || "").hostname.toLowerCase();
      } catch {
        // Browser pages do not have per-site rules.
      }
      const hasAnyRules = Object.values(settings.hiddenElementsByHost).some((siteRules) => siteRules.length > 0);
      sendResponse({ host, selectors: settings.hiddenElementsByHost[host] || [], hasAnyRules });
    }).catch(() => sendResponse({ host: "", selectors: [], hasAnyRules: false }));
    return true;
  }

  if (sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`)
      && message?.type === "startpage-element-hiding-active-site-remove") {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(async ([tab]) => {
      let host = "";
      try {
        host = new URL(tab?.url || "").hostname.toLowerCase();
      } catch {
        return { ok: false, error: "Open the website containing the hidden item first." };
      }
      const settings = await loadHidingSettings();
      const selectors = settings.hiddenElementsByHost[host] || [];
      if (!selectors.includes(message.selector)) return { ok: false, error: "That hidden item is no longer saved for this site." };
      settings.hiddenElementsByHost[host] = selectors.filter((selector) => selector !== message.selector);
      if (!settings.hiddenElementsByHost[host].length) delete settings.hiddenElementsByHost[host];
      await saveHidingSettings(settings);
      return { ok: true, host, selectors: settings.hiddenElementsByHost[host] || [] };
    }).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`)
      && message?.type === "startpage-element-hiding-active-site-clear") {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(async ([tab]) => {
      let host = "";
      try {
        host = new URL(tab?.url || "").hostname.toLowerCase();
      } catch {
        return { ok: false, error: "Open the website containing the hidden items first." };
      }
      const settings = await loadHidingSettings();
      delete settings.hiddenElementsByHost[host];
      await saveHidingSettings(settings);
      return { ok: true, host, selectors: [] };
    }).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`)
      && message?.type === "startpage-element-hiding-clear-all") {
    saveHidingSettings({ enabled: false, hiddenElementsByHost: {} })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "startpage-site-customizer-ready" && sender.tab?.id) {
    Promise.all([chrome.storage.local.get("websiteAppearance"), loadHidingSettings()]).then(([{ websiteAppearance }, hiding]) => {
      return updateTabAppearance(sender.tab.id, sender.url, null, websiteAppearance || websiteDefaults, null, hiding);
    }).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "startpage-site-picker-toggle" && sender.tab?.id && trustedStartpage(sender.url)) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => {
      if (!tab?.id || tab.id === sender.tab.id) return { ok: false, error: "Open the website you want to customize, then use the extension button." };
      return chrome.tabs.sendMessage(tab.id, { type: "startpage-site-picker-toggle" }).then(() => ({ ok: true }));
    }).then(sendResponse).catch(() => sendResponse({ ok: false, error: "This page does not allow element picking." }));
    return true;
  }

  if (message?.type === "startpage-site-picker-toggle-active-tab" && sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`)) {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(async ([tab]) => {
      if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) return { ok: false, error: "Open a regular website to use the picker." };
      const hiding = await loadHidingSettings();
      if (!hiding.enabled) await saveHidingSettings({ ...hiding, enabled: true });
      await chrome.tabs.sendMessage(tab.id, { type: "startpage-site-picker-toggle" });
      return { ok: true };
    }).then(sendResponse).catch(() => sendResponse({ ok: false, error: "This page does not allow element picking. Try another website." }));
    return true;
  }

  if (message?.type === "startpage-site-picker-css" && sender.tab?.id) {
    const injection = { target: { tabId: sender.tab.id }, css: pickerCss, origin: "USER" };
    const operation = message.active ? chrome.scripting.insertCSS(injection) : chrome.scripting.removeCSS(injection);
    operation.then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message?.type === "startpage-site-hide-element") {
    addHiddenElement(message, sender).then(sendResponse).catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type !== "startpage-media" || !trustedStartpage(sender.url) || !sender.tab?.id) return;

  (async () => {
    if (message.action === "getState") {
      return { media: await findMediaSources(sender.tab.id) };
    }

    const target = message.target;
    if (!target || !Number.isInteger(target.tabId) || !Number.isInteger(target.frameId) || !Number.isInteger(target.mediaIndex)) {
      return { error: "Choose a media tab first." };
    }
    const results = await chrome.scripting.executeScript({
      target: { tabId: target.tabId, frameIds: [target.frameId] },
      func: controlMedia,
      args: [message.action, message.value, target.mediaIndex, target.src],
    });
    return results[0]?.result || { error: "The player did not respond." };
  })().then(sendResponse).catch((error) => sendResponse({ error: error.message || "Media control failed." }));

  return true;
});
