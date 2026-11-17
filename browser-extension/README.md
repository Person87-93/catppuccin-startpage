# Startpage Media Controls extension

This optional Manifest V3 extension connects the startpage's Music widget to HTML audio/video players in other tabs. It runs locally and does not send tab or media information to a server.

## Install in Opera GX or Chrome

1. Open `opera://extensions` in Opera GX or `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this `browser-extension` folder.
4. Allow the extension to access sites where you use music or video players. It requests access to HTTP and HTTPS sites so it can find media elements across tabs.
5. Reload the startpage, open the Music widget, and press refresh if needed.

The extension can control standard HTML audio/video elements. Some protected, browser-internal, or custom players may not expose a controllable media element. The extension cannot skip tracks unless the website's player itself exposes that through its page controls.
