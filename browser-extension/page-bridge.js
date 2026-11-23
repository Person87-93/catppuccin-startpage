// Bridges only this startpage's own UI to the extension service worker.
(() => {
  const allowed = location.hostname === "person87-93.github.io" || location.hostname === "localhost";
  if (!allowed) return;

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (event.source !== window || event.origin !== location.origin) return;

    if (message?.type === "startpage-site-settings-get" && typeof message.requestId === "string") {
      chrome.runtime.sendMessage({ type: "startpage-site-settings-get" }, (response) => {
        const error = chrome.runtime.lastError?.message;
        window.postMessage({
          type: "startpage-site-settings-response",
          requestId: message.requestId,
          settings: error ? null : response?.settings || null,
        }, location.origin);
      });
      return;
    }

    if (message?.type === "startpage-site-settings" && message.settings && typeof message.settings === "object") {
      chrome.runtime.sendMessage({ type: "startpage-site-settings", settings: message.settings }, () => {
        // Read lastError so an unavailable extension does not produce an unhandled callback warning.
        void chrome.runtime.lastError;
      });
      return;
    }

    if (message?.type === "startpage-element-hiding-get" && typeof message.requestId === "string") {
      chrome.runtime.sendMessage({ type: "startpage-element-hiding-get" }, (response) => {
        const error = chrome.runtime.lastError?.message;
        window.postMessage({
          type: "startpage-element-hiding-response",
          requestId: message.requestId,
          settings: error ? null : response?.settings || null,
        }, location.origin);
      });
      return;
    }

    if (message?.type === "startpage-element-hiding-settings" && message.settings && typeof message.settings === "object") {
      chrome.runtime.sendMessage({ type: "startpage-element-hiding-settings", settings: message.settings }, () => {
        void chrome.runtime.lastError;
      });
      return;
    }

    if (message?.type === "startpage-element-picker-toggle") {
      chrome.runtime.sendMessage({ type: "startpage-site-picker-toggle" }, (response) => {
        const error = chrome.runtime.lastError?.message;
        window.postMessage({
          type: "startpage-element-picker-response",
          requestId: message.requestId,
          response: error ? { ok: false, error } : response,
        }, location.origin);
      });
      return;
    }

    const browserToolsTypes = new Set([
      "browser-tools-open-dashboard",
      "browser-tools-open-shortcut-settings",
      "browser-tools-workspaces-get",
      "browser-tools-workspace-save",
      "browser-tools-workspace-restore",
      "browser-tools-workspace-delete",
      "browser-tools-workspace-rename",
      "browser-tools-focus-get",
      "browser-tools-focus-set",
      "browser-tools-focus-toggle",
      "browser-tools-diagnostics",
      "browser-tools-settings-get",
      "browser-tools-settings-set",
      "browser-tools-saved-links",
      "browser-tools-notes-get",
      "browser-tools-notes-set",
    ]);
    if (browserToolsTypes.has(message?.type) && typeof message.requestId === "string") {
      const payload = {
        type: message.type,
        name: message.name,
        id: message.id,
        settings: message.settings,
        notes: message.notes,
      };
      chrome.runtime.sendMessage(payload, (response) => {
        const error = chrome.runtime.lastError?.message;
        window.postMessage({
          type: "browser-tools-response",
          requestId: message.requestId,
          response: error ? { ok: false, error } : response,
        }, location.origin);
      });
      return;
    }

    if (message?.type !== "startpage-media-request" || typeof message.requestId !== "string") return;
    const allowedActions = new Set(["getState", "play", "pause", "toggle", "seek", "volume"]);
    if (!allowedActions.has(message.action)) return;

    chrome.runtime.sendMessage({
      type: "startpage-media",
      action: message.action,
      target: message.target,
      value: message.value,
      sourceTabId: message.sourceTabId,
    }, (response) => {
      const error = chrome.runtime.lastError?.message;
      window.postMessage({
        type: "startpage-media-response",
        requestId: message.requestId,
        response: error ? { error } : response,
      }, location.origin);
    });
  });
})();
