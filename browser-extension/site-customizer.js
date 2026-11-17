// Handles page element selection; the service worker injects appearance CSS through chrome.scripting.
(() => {
  let currentSettings = null;
  let pickerActive = false;
  let pickerNotice = null;
  let noticeTimer = null;

  function sendPickerCss(active) {
    chrome.runtime.sendMessage({ type: "startpage-site-picker-css", active }, () => {
      void chrome.runtime.lastError;
    });
  }

  function showNotice(text, autoDismiss = true) {
    if (!document.documentElement) return;
    if (!pickerNotice) {
      pickerNotice = document.createElement("div");
      pickerNotice.id = "startpage-picker-notice";
      pickerNotice.setAttribute("aria-live", "polite");
      document.documentElement.append(pickerNotice);
    }
    pickerNotice.textContent = text;
    if (noticeTimer) window.clearTimeout(noticeTimer);
    sendPickerCss(true);
    if (autoDismiss) {
      noticeTimer = window.setTimeout(() => {
        pickerNotice?.remove();
        pickerNotice = null;
        sendPickerCss(false);
      }, 3500);
    }
  }

  function selectorFor(element) {
    const parts = [];
    let current = element;
    while (current && current !== document.body && parts.length < 4) {
      let part = current.localName;
      if (current.id) {
        part += `#${CSS.escape(current.id)}`;
        parts.unshift(part);
        break;
      }
      if (current.classList?.length) {
        part += [...current.classList].slice(0, 2).map((name) => `.${CSS.escape(name)}`).join("");
      }
      const siblings = current.parentElement ? [...current.parentElement.children].filter((sibling) => sibling.localName === current.localName) : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(" > ");
  }

  function describeElement(element) {
    const identifier = element.id ? `#${element.id}` : [...(element.classList || [])].slice(0, 2).map((name) => `.${name}`).join("");
    const label = element.getAttribute("aria-label") || element.getAttribute("title") || element.innerText || element.textContent || "";
    const summary = String(label).replace(/\s+/g, " ").trim().slice(0, 70);
    return `<${element.localName}${identifier}>${summary ? ` · ${summary}` : ""}`;
  }

  function setPicker(active) {
    pickerActive = active;
    if (noticeTimer) window.clearTimeout(noticeTimer);
    if (pickerNotice) {
      pickerNotice.remove();
      pickerNotice = null;
    }
    if (active) showNotice("Element picker on — click an item to hide it. Alt+Shift+P cancels.", false);
    else sendPickerCss(false);
  }

  document.addEventListener("keydown", (event) => {
    if (!event.altKey || !event.shiftKey || event.key.toLowerCase() !== "p" || !currentSettings?.enabled) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setPicker(!pickerActive);
  }, true);

  document.addEventListener("pointerover", (event) => {
    if (!pickerActive || !(event.target instanceof Element) || event.target.id === "startpage-picker-notice") return;
    event.target.setAttribute("data-startpage-picker-hover", "");
  }, true);

  document.addEventListener("pointerout", (event) => {
    if (pickerActive && event.target instanceof Element) event.target.removeAttribute("data-startpage-picker-hover");
  }, true);

  document.addEventListener("click", (event) => {
    if (!pickerActive || !(event.target instanceof Element)) return;
    const element = event.target;
    if (element === document.body || element === document.documentElement) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const selector = selectorFor(element);
    element.removeAttribute("data-startpage-picker-hover");
    setPicker(false);
    try {
      if (!selector || !document.querySelector(selector)) throw new Error("selector could not be resolved");
    } catch {
      showNotice("Could not create a stable selector for that item.");
      return;
    }
    chrome.runtime.sendMessage({ type: "startpage-site-hide-element", host: location.hostname.toLowerCase(), selector }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) {
        showNotice("Could not save the selected element.");
        return;
      }
      showNotice(`Hidden ${describeElement(element)}. Remove its selector from startpage settings to restore it.`);
    });
  }, true);

  chrome.storage.local.get("websiteAppearance", ({ websiteAppearance }) => {
    currentSettings = websiteAppearance || {};
    chrome.runtime.sendMessage({ type: "startpage-site-customizer-ready" }, () => {
      void chrome.runtime.lastError;
    });
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.websiteAppearance) {
      currentSettings = changes.websiteAppearance.newValue || {};
      if (!currentSettings.enabled && pickerActive) {
        document.querySelectorAll("[data-startpage-picker-hover]").forEach((element) => element.removeAttribute("data-startpage-picker-hover"));
        setPicker(false);
      }
    }
  });
})();
