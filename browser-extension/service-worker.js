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
  const mediaIndex = elements.findIndex((element) => !element.paused && !element.ended && Boolean(element.currentSrc || element.src));
  const index = mediaIndex >= 0 ? mediaIndex : elements.findIndex((element) => Boolean(element.currentSrc || element.src));
  if (index < 0) return null;

  const element = elements[index];
  const metadata = navigator.mediaSession?.metadata;
  return {
    mediaIndex: index,
    title: metadata?.title || document.title || "Media",
    artist: metadata?.artist || "",
    album: metadata?.album || "",
    host: location.hostname,
    playing: !element.paused && !element.ended,
    currentTime: Number(element.currentTime) || 0,
    duration: Number.isFinite(element.duration) ? element.duration : 0,
    volume: element.muted ? 0 : element.volume,
    seekable: Number.isFinite(element.duration) && element.duration > 0,
  };
}

async function controlMedia(action, value, mediaIndex) {
  const elements = Array.from(document.querySelectorAll("audio, video"));
  const element = elements[mediaIndex];
  if (!element) return { ok: false, error: "The media player is no longer available." };

  if (action === "play") {
    try {
      await element.play();
    } catch {
      return { ok: false, error: "The website blocked playback. Start it from the music tab first." };
    }
  }
  else if (action === "pause") element.pause();
  else if (action === "toggle") element.paused ? element.play() : element.pause();
  else if (action === "seek" && Number.isFinite(element.duration)) element.currentTime = Math.min(element.duration, Math.max(0, Number(value)));
  else if (action === "volume") {
    element.muted = false;
    element.volume = Math.min(1, Math.max(0, Number(value)));
  }
  return { ok: true };
}

async function findPlayingMedia(sourceTabId) {
  const tabs = await chrome.tabs.query({});
  const found = [];
  await Promise.all(tabs.filter((tab) => tab.id !== sourceTabId).map(async (tab) => {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: readMediaFromPage,
      });
      results.forEach(({ frameId, result }) => {
        if (result) found.push({ tabId: tab.id, frameId, ...result });
      });
    } catch {
      // Some browser pages and sites without granted access cannot be inspected.
    }
  }));

  found.sort((a, b) => Number(b.playing) - Number(a.playing));
  return found[0] || null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "startpage-media" || !trustedStartpage(sender.url) || !sender.tab?.id) return;

  (async () => {
    if (message.action === "getState") {
      return { media: await findPlayingMedia(sender.tab.id) };
    }

    const target = message.target;
    if (!target || !Number.isInteger(target.tabId) || !Number.isInteger(target.frameId) || !Number.isInteger(target.mediaIndex)) {
      return { error: "Choose a media tab first." };
    }
    const results = await chrome.scripting.executeScript({
      target: { tabId: target.tabId, frameIds: [target.frameId] },
      func: controlMedia,
      args: [message.action, message.value, target.mediaIndex],
    });
    return results[0]?.result || { error: "The player did not respond." };
  })().then(sendResponse).catch((error) => sendResponse({ error: error.message || "Media control failed." }));

  return true;
});
