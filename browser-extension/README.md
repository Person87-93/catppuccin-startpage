# Catppuccin Startpage Tools extension

This optional Manifest V3 extension connects the startpage's Music widget to HTML audio/video players in other tabs, applies browser-local website appearance settings, and adds browser-wide workspaces, focus mode, context-menu actions, a command palette, and diagnostics. Workspace, focus, and productivity data stays in `chrome.storage.local`; the extension does not send tab contents or browsing data to a third-party server.

## Install in Opera GX or Chrome

1. Open `opera://extensions` in Opera GX or `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this `browser-extension` folder.
4. Allow the extension to access HTTP and HTTPS websites. This permission supports media controls, website customisation, and the focus reminder overlay.
5. The extension also requests browser permissions for context menus, tab groups, and scheduled focus checks. Browser notifications are optional and are requested only when you enable them from the browser dashboard.
6. Reload the startpage. The small **browser** control in the status bar opens the browser dashboard.

## Website appearance

Open **Customize** on the startpage and enable **Website appearance**. The background, text, link and border colours, panel transparency and blur, typography, and spacing settings apply to ordinary web pages in the browser. They are saved locally and update open tabs without a browser restart. Disable the option to remove the injected stylesheet and restore the site's normal appearance.

Element hiding is independent of website appearance. Enable it in startpage settings, then press **Alt+Shift+P** or open the extension toolbar button and choose **Start element picker** on a page. Click an element to hide it on that hostname. The extension toolbar popup also lists hidden items on the current site, with per-item restore, **Restore all on this site**, and **Restore all sites** actions. This is a recovery path even if a hidden item blocks the startpage settings menu. You can also use the separate **Hidden elements by site** list in startpage settings to review or remove selector rules. CSS selectors keep applying to matching elements that a site adds later, including in single-page apps.

The customizer styles the top-level document and does not cross into shadow roots, browser-internal pages, the Chrome Web Store, or inaccessible protected pages. Site layouts differ, so a global colour change may not suit every page; disable it or tune the colours if a site becomes hard to read. The picker creates a CSS selector from the clicked element and its nearby ancestors, which can become stale if the site changes its markup.

The extension can control standard HTML audio/video elements across multiple tabs. The Music panel shows one detailed currently-playing source and compact rows for other available sources; select a row to switch the main controls to that source. Media actions revalidate the selected element before controlling it, so a replaced or reordered player produces a clear error instead of silently targeting the wrong element. Some protected, browser-internal, or custom players may not expose a controllable media element. The extension cannot skip tracks unless the website's player itself exposes that through its page controls.

## Browser workspaces

Open the browser dashboard from the startpage status bar or the extension's command palette. Save the regular website tabs in the current window under a workspace name, then restore them later. Restoring opens only URLs that are not already open and does not close your existing tabs. Newly restored tabs are placed in a Chrome tab group when the browser supports it. Workspaces can be renamed or deleted without closing tabs.

The optional **Save before restoring** setting captures the current active workspace before another workspace is restored.

## Focus mode

Add website hostnames to the focus list and choose a schedule and days in the dashboard or the startpage's **Focus mode** settings category. You can also enable or disable focus mode manually from the dashboard or command palette. Matching pages display a reminder overlay while focus mode is active. This is a productivity aid, not a security restriction or a way to enforce access controls.

## Browser-wide command palette and context menu

Use **Ctrl+Shift+K** (or **Command+Shift+K** on macOS) to open the browser-wide command palette. Chrome lets you change the shortcut from the extension shortcut manager, linked in the startpage's **Commands** settings category.

Right-click a page, link, or selected text to open the **Startpage tools** submenu. It can open the command palette, save a link, search selected text, add selected text to quick notes, or open a link alongside a saved workspace. The submenu is added to the browser context menu; it does not replace a website's own right-click menu. Disable it from **Commands** in the startpage settings.

## Diagnostics

The browser dashboard reports open and duplicate tab counts, saved workspaces, tab groups, focus state, extension version, extension storage size, and available load timings for the active page. Chrome does not expose every internal browser performance metric, so unavailable measurements are shown as such. Recent extension errors are kept locally when diagnostic history is enabled.

## Update center status

The update-center interface and topic preferences are present, but automatic collection is not active yet. The approved Google-only ChatGPT-to-Apps-Script callback still needs a supported automatic handoff. Until that is verified, the extension does not claim that updates are being delivered and does not substitute another external service. Email digests remain disabled; browser notifications can be enabled separately after granting the optional permission.
