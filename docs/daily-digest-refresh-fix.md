# Daily digest refresh fix

## What was broken
The homepage refresh button only requested the existing `digest` response. It did not run the Apps Script `collect-now` action, so the widget could repeatedly display stale sheet data. The page bridge also only forwarded the read-only digest request.

## Changes in 1.6.3
- Added a trusted `startpage-digest-refresh` message from the homepage through the extension page bridge.
- The extension now runs `collect-now`, refreshes its update-feed cache, and then reads the digest.
- The widget has a distinct refreshing state, disables its refresh button while work is in progress, allows up to 60 seconds for collection, and shows refresh errors without discarding cached content.
- Bumped the browser extension manifest version to 1.6.3.

## Existing backend/source issue
The live `Sources` sheet had a Fortnite row using the legacy Epic JSON endpoint with type `fortnite`. The committed Apps Script collector only dispatches `html` specially and otherwise parses the response as RSS/XML, which explains the recorded SAX parse error. The sheet row should use the current Fortnite news HTML source (`https://www.fortnite.com/news?lang=en-US`, type `html`, path prefix `/news/`). This source correction is tracked separately in the spreadsheet.

## Deployment notes
This commit updates the GitHub Pages source and extension package source only. The Apps Script web-app deployment is not changed here. Redeploy the extension by loading/reloading the updated `browser-extension` folder in the browser. The homepage will use the new refresh flow once the updated extension is loaded. The Apps Script endpoint must already be deployed with the `collect-now` action.

## Remaining validation
The Apps Script project could not be inspected or deployed because the Google Apps Script Composio connection requires a one-time custom auth setup. The spreadsheet currently contains a static digest row and empty Tasks/Calendar tabs; collecting RSS updates does not synthesize an AI-written daily summary or populate personal tasks/events.
