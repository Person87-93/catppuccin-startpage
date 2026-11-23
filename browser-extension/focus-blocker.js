// Displays a lightweight block screen when a configured focus profile is active.
(() => {
  if (!/^https?:$/.test(location.protocol)) return;
  const host = location.hostname.toLowerCase();
  let overlay = null;

  function matchesSite(sites) {
    return Array.isArray(sites) && sites.some((site) => host === site || host.endsWith(`.${site}`));
  }

  function removeOverlay() {
    overlay?.remove();
    overlay = null;
  }

  function showOverlay() {
    if (overlay || !document.documentElement) return;
    overlay = document.createElement("div");
    overlay.id = "startpage-focus-overlay";
    overlay.style.cssText = "position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;background:#11111b;color:#cdd6f4;font:16px/1.5 system-ui,sans-serif;text-align:center;";
    const card = document.createElement("section");
    card.style.cssText = "width:min(460px,100%);padding:34px;border:1px solid #45475a;border-radius:18px;background:linear-gradient(145deg,#1e1e2e,#24243a);box-shadow:0 20px 70px #0008;";
    const title = document.createElement("h1");
    title.textContent = "focus mode is active";
    title.style.cssText = "margin:0 0 10px;font-size:25px;";
    const description = document.createElement("p");
    description.textContent = "this website is on your focus list. you can return when your focus session ends.";
    description.style.cssText = "margin:0 0 22px;color:#a6adc8;";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "close this page";
    button.style.cssText = "padding:10px 16px;border:0;border-radius:9px;background:#cba6f7;color:#1e1e2e;font-weight:700;cursor:pointer;";
    button.addEventListener("click", () => window.close());
    card.append(title, description, button);
    overlay.append(card);
    document.documentElement.append(overlay);
  }

  async function refresh() {
    try {
      const stored = await chrome.storage.local.get(["browserFocus", "focusRuntime"]);
      const settings = stored.browserFocus || {};
      const runtime = stored.focusRuntime || {};
      if (runtime.active && matchesSite(settings.sites)) showOverlay();
      else removeOverlay();
    } catch {
      removeOverlay();
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "browser-focus-refresh") refresh();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.browserFocus || changes.focusRuntime)) refresh();
  });
  refresh();
})();
