const button = document.querySelector("#pick");
const status = document.querySelector("#status");

button.addEventListener("click", () => {
  button.disabled = true;
  status.textContent = "Turning on the picker…";
  chrome.runtime.sendMessage({ type: "startpage-site-picker-toggle-active-tab" }, (response) => {
    const error = chrome.runtime.lastError?.message;
    if (error || !response?.ok) {
      status.textContent = error || response?.error || "Could not start the picker on this page.";
      button.disabled = false;
      return;
    }
    status.textContent = "Picker is on. Click an element on the page to hide it.";
    window.setTimeout(() => window.close(), 700);
  });
});
