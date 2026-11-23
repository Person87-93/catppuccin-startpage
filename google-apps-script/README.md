# Google Apps Script update-center backend

This folder contains the Google Apps Script backend for the browser extension's update center. It uses only Google Apps Script services plus public source websites and RSS feeds. It does not require ChatGPT, a third-party feed aggregator, or a separate hosting provider.

## What it does

- Checks configured RSS/Atom feeds and supported public news pages.
- Stores sources and collected links in a Google spreadsheet.
- Deduplicates articles by source and canonical URL.
- Runs automatically every six hours after setup.
- Exposes a small JSON endpoint for the extension.
- Lets the extension add, enable/disable, and remove sources.

The script stores article titles, short feed descriptions when available, source names, categories, publication dates when supplied, discovery dates, and original links. It does not copy full articles.

## Initial sources

The setup function adds these starting sources:

- Xbox Wire RSS: https://news.xbox.com/en-us/feed/
- Chrome Releases RSS: https://chromereleases.googleblog.com/feeds/posts/default?alt=rss
- Chrome for Developers RSS: https://developer.chrome.com/static/blog/feed.xml
- Fortnite official news page: HTML link monitoring at https://www.fortnite.com/news?lang=en-US
- REC Foundation news page: HTML link monitoring at https://recfoundation.net/about-us/news/
- VEX community forum RSS: https://www.vexforum.com/latest.rss

RSS sources are parsed as RSS or Atom. HTML sources require a path prefix to avoid collecting unrelated navigation links. Page markup can change, so HTML sources may need their path prefix or source URL adjusted. The VEX forum is a community source, not an official rules authority. For rule changes, confirm the original VEX game manual and official announcements.

## Setup

1. Open [Google Apps Script](https://script.google.com/) and create a standalone project.
2. Copy the contents of `Code.gs` into the editor. If you use the manifest, enable **Show "appsscript.json" manifest file** in Project Settings and copy that file too.
3. Save the project.
4. Select and run `setupUpdateCenter`. Approve the Google Sheets, external request, and trigger permissions.
5. Open the execution log. Copy the generated `apiKey` value. The function also logs the spreadsheet URL.
6. Choose **Deploy → New deployment → Web app**.
7. Set **Execute as** to your account. Set access to **Anyone** so the extension can retrieve public update metadata. The API key is required for every request.
8. Deploy and copy the web app URL ending in `/exec`.
9. In the extension browser dashboard, paste the web app URL and API key, then choose **save connection**.
10. Use **collect now** once to verify the first import.

Keep the API key private. The web app is accessible to anyone who has both the deployment URL and key. The key is stored in the extension's local browser storage and is not a high-security credential. The endpoint returns only the update feed and source configuration, not your Google account data.

## Managing sources

Open the spreadsheet created by setup. The **Sources** sheet contains the source list. You can also add, enable/disable, and remove sources from the extension dashboard. Supported types are:

- `rss`: RSS 2.0 or Atom feed URL.
- `html`: public HTTPS listing page plus a path prefix such as `/news/`.

For HTML sources, choose a prefix that identifies article URLs and excludes navigation. HTML page monitoring is intentionally lightweight and may need adjustment when a publisher redesigns its page. Only use sources you are allowed to access.

The **Updates** sheet contains collected metadata and original links. It keeps the newest 500 items.

## Scheduling and limits

The collector runs every six hours. Google Apps Script time-driven triggers are approximate and may execute within a time window rather than at an exact minute. You can run `collectUpdates` manually from the editor or use the dashboard's **collect now** action.

Apps Script has execution, URL fetch, and spreadsheet quotas. Keep the source list focused and avoid very short polling intervals. If a source repeatedly fails, its error is shown in the Sources sheet and dashboard.

## Troubleshooting

- **Unauthorized:** confirm the copied API key matches the one in the Apps Script execution log.
- **Could not connect:** confirm the web app URL is the deployed `/exec` URL, not the `/dev` test URL.
- **No items from an HTML source:** inspect the source page's article links and update its path prefix. Some pages use client-side rendering and cannot be read by Apps Script.
- **A feed is failing:** open its URL in a browser and confirm it returns RSS/Atom XML. Disable or remove unavailable feeds.

The backend must be deployed from your own Google account. The repository cannot deploy or authorize a Google Apps Script project on your behalf.
