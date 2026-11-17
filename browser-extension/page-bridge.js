// Bridges only this startpage's own UI to the extension service worker.
(() => {
  const allowed = location.hostname === "person87-93.github.io" || location.hostname === "localhost";
  if (!allowed) return;

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (event.source !== window || event.origin !== location.origin) return;
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
