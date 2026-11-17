# Startpage Media Controls extension

This optional Manifest V3 extension connects the startpage's Music widget to HTML audio/video players in other tabs. It can also apply browser-local appearance settings to ordinary websites. It stores those settings in `chrome.storage.local` and does not send website preferences, tab contents, or media information to a server.

## Install in Opera GX or Chrome

1. Open `opera://extensions` in Opera GX or `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this `browser-extension` folder.
4. Allow the extension to access HTTP and HTTPS websites. This permission supports both finding media elements across tabs and applying the optional website customizations.
5. Reload the startpage, open the Music widget, and press refresh if needed.

## Website appearance

Open **Customize** on the startpage and enable **Website appearance**. The background, text, link and border colours, panel transparency and blur, typography, and spacing settings apply to ordinary web pages in the browser. They are saved locally and update open tabs without a browser restart. Disable the option to remove the injected stylesheet and restore the site's normal appearance.

Press **Alt+Shift+P** on a page to turn on the element picker, then click an element to hide it on that hostname. Use the **Hidden elements by site** list in startpage settings to review or remove selector rules. CSS selectors keep applying to matching elements that a site adds later, including in single-page apps.

The customizer styles the top-level document and does not cross into shadow roots, browser-internal pages, the Chrome Web Store, or inaccessible protected pages. Site layouts differ, so a global colour change may not suit every page; disable it or tune the colours if a site becomes hard to read. The picker creates a CSS selector from the clicked element and its nearby ancestors, which can become stale if the site changes its markup.

The extension can control standard HTML audio/video elements. Some protected, browser-internal, or custom players may not expose a controllable media element. The extension cannot skip tracks unless the website's player itself exposes that through its page controls.
