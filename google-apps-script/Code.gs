/**
 * Catppuccin Startpage Update Center
 * Google Apps Script backend. No third-party aggregation services are used.
 *
 * Run setupUpdateCenter() once, authorize it, then deploy as a web app:
 * Execute as: Me
 * Who has access: Anyone
 *
 * The generated API key is written to the execution log. Store it in the
 * browser extension settings. The key protects the public JSON endpoint from
 * casual use; it is not a substitute for OAuth or a secret-management system.
 */

const UPDATE_SHEET_KEY = "UPDATE_CENTER_SPREADSHEET_ID";
const UPDATE_API_KEY = "UPDATE_CENTER_API_KEY";
const SOURCE_HEADERS = ["id", "name", "category", "type", "url", "enabled", "pathPrefix", "keywords", "lastChecked", "lastError"];
const UPDATE_HEADERS = ["id", "sourceId", "sourceName", "category", "title", "url", "summary", "publishedAt", "discoveredAt"];

const DEFAULT_SOURCES = [
  ["xbox-wire", "Xbox Wire", "xbox", "rss", "https://news.xbox.com/en-us/feed/", true, "", "", "", ""],
  ["chrome-releases", "Chrome Releases", "browser", "rss", "https://chromereleases.googleblog.com/feeds/posts/default?alt=rss", true, "", "", "", ""],
  ["chrome-developers", "Chrome for Developers", "browser", "rss", "https://developer.chrome.com/static/blog/feed.xml", true, "", "", "", ""],
  ["fortnite-news", "Fortnite News", "fortnite", "html", "https://www.fortnite.com/news?lang=en-US", true, "/news/", "", "", ""],
  ["rec-foundation", "REC Foundation News", "vex", "html", "https://recfoundation.net/about-us/news/", true, "/about-us/news/", "", "", ""],
  ["vex-forum", "VEX Community Forum", "vex", "rss", "https://www.vexforum.com/latest.rss", true, "", "competition,game manual,rule,update,announcement", "", ""]
];

function setupUpdateCenter() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty(UPDATE_SHEET_KEY);
  let spreadsheet;
  if (spreadsheetId) {
    try { spreadsheet = SpreadsheetApp.openById(spreadsheetId); } catch (error) { spreadsheet = null; }
  }
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create("Catppuccin Startpage Updates");
    spreadsheetId = spreadsheet.getId();
    props.setProperty(UPDATE_SHEET_KEY, spreadsheetId);
  }

  ensureSheet_(spreadsheet, "Sources", SOURCE_HEADERS, DEFAULT_SOURCES);
  ensureSheet_(spreadsheet, "Updates", UPDATE_HEADERS, []);
  let apiKey = props.getProperty(UPDATE_API_KEY);
  if (!apiKey) {
    apiKey = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
    props.setProperty(UPDATE_API_KEY, apiKey);
  }

  if (!props.getProperty("UPDATE_CENTER_FREQUENCY")) props.setProperty("UPDATE_CENTER_FREQUENCY", "6h");
  configureCollectionTrigger_();

  const result = collectUpdates();
  const setupInfo = {
    spreadsheetUrl: spreadsheet.getUrl(),
    apiKey: apiKey,
    collected: result.added || 0,
    note: "Copy the API key into the extension. Deploy this project as a web app that executes as you and is accessible to anyone."
  };
  Logger.log(JSON.stringify(setupInfo, null, 2));
  return setupInfo;
}

function doGet(event) {
  try {
    authorize_(event && event.parameter && event.parameter.key);
    const action = String(event.parameter.action || "feed");
    if (action === "feed" || action === "status") return json_(getFeed_());
    if (action === "sources") return json_({ ok: true, sources: readSources_(), lastRun: getLastRun_() });
    return json_({ ok: false, error: "Unknown action." });
  } catch (error) {
    return json_({ ok: false, error: safeError_(error) });
  }
}

function doPost(event) {
  try {
    const body = JSON.parse(event && event.postData && event.postData.contents || "{}");
    authorize_(body.key);
    const action = String(body.action || "");
    if (action === "collect-now") {
      const result = collectUpdates();
      return json_({ ok: true, added: result.added || 0, lastRun: getLastRun_(), ...getFeed_() });
    }
    if (action === "set-frequency") {
      const frequency = ["6h", "12h", "daily", "weekly"].includes(body.frequency) ? body.frequency : "6h";
      const props = PropertiesService.getScriptProperties();
      if (props.getProperty("UPDATE_CENTER_FREQUENCY") !== frequency) {
        props.setProperty("UPDATE_CENTER_FREQUENCY", frequency);
        configureCollectionTrigger_();
      }
      return json_({ ok: true, frequency });
    }
    if (action === "source-add") return json_(addSource_(body.source || {}));
    if (action === "source-toggle") return json_(toggleSource_(body.id, body.enabled === true));
    if (action === "source-remove") return json_(removeSource_(body.id));
    return json_({ ok: false, error: "Unknown action." });
  } catch (error) {
    return json_({ ok: false, error: safeError_(error) });
  }
}

function configureCollectionTrigger_() {
  const frequency = PropertiesService.getScriptProperties().getProperty("UPDATE_CENTER_FREQUENCY") || "6h";
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === "collectUpdates")
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  const builder = ScriptApp.newTrigger("collectUpdates").timeBased();
  if (frequency === "12h") builder.everyHours(12).create();
  else if (frequency === "daily") builder.everyDays(1).atHour(6).create();
  else if (frequency === "weekly") builder.everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(6).create();
  else builder.everyHours(6).create();
}

function collectUpdates() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { ok: false, error: "A collection run is already active.", added: 0 };
  try {
    const spreadsheet = getSpreadsheet_();
    const sourceSheet = spreadsheet.getSheetByName("Sources");
    const updateSheet = spreadsheet.getSheetByName("Updates");
    const sources = readSources_().filter(source => source.enabled);
    const existing = new Set();
    if (updateSheet.getLastRow() > 1) {
      updateSheet.getRange(2, 1, updateSheet.getLastRow() - 1, 1).getValues().flat().forEach(value => existing.add(String(value)));
    }

    const additions = [];
    const sourceRows = sourceSheet.getLastRow() > 1
      ? sourceSheet.getRange(2, 1, sourceSheet.getLastRow() - 1, SOURCE_HEADERS.length).getValues()
      : [];
    const now = new Date().toISOString();

    sources.forEach(source => {
      let errorText = "";
      try {
        const entries = source.type === "html" ? fetchHtmlEntries_(source) : fetchRssEntries_(source);
        const keywords = String(source.keywords || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
        entries.forEach(entry => {
          if (keywords.length && !keywords.some(keyword => (entry.title + " " + entry.summary).toLowerCase().includes(keyword))) return;
          const canonicalUrl = normalizeUrl_(entry.url);
          if (!canonicalUrl) return;
          const id = digest_(source.id + "|" + canonicalUrl);
          if (existing.has(id)) return;
          existing.add(id);
          additions.push([
            id, source.id, source.name, source.category, entry.title,
            canonicalUrl, entry.summary || "", entry.publishedAt || "", now
          ]);
        });
      } catch (error) {
        errorText = safeError_(error).slice(0, 240);
      }
      const row = sourceRows.find(item => String(item[0]) === source.id);
      if (row) {
        row[8] = now;
        row[9] = errorText;
      }
    });

    if (sourceRows.length) sourceSheet.getRange(2, 1, sourceRows.length, SOURCE_HEADERS.length).setValues(sourceRows);
    if (additions.length) {
      updateSheet.getRange(updateSheet.getLastRow() + 1, 1, additions.length, UPDATE_HEADERS.length).setValues(additions);
      trimUpdates_(updateSheet, 500);
    }
    PropertiesService.getScriptProperties().setProperty("UPDATE_CENTER_LAST_RUN", now);
    return { ok: true, added: additions.length, lastRun: now };
  } finally {
    lock.releaseLock();
  }
}

function fetchRssEntries_(source) {
  const response = UrlFetchApp.fetch(source.url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { "User-Agent": "CatppuccinStartpageUpdateCenter/1.0 (+RSS reader)" }
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error("Feed returned HTTP " + response.getResponseCode());
  }
  const document = XmlService.parse(response.getContentText());
  const root = document.getRootElement();
  const nodes = descendantsNamed_(root, "item").concat(descendantsNamed_(root, "entry"));
  return nodes.slice(0, 30).map(node => {
    const title = childText_(node, ["title"]);
    const linkNode = childNodes_(node, ["link"])[0];
    const link = linkNode ? (linkNode.getAttribute("href") ? linkNode.getAttribute("href").getValue() : linkNode.getText()) : "";
    const summary = childText_(node, ["description", "summary", "content", "encoded"]);
    const published = childText_(node, ["pubDate", "published", "updated", "date"]);
    return {
      title: cleanText_(title).slice(0, 240),
      url: resolveUrl_(source.url, link),
      summary: cleanText_(summary).slice(0, 500),
      publishedAt: parseDate_(published)
    };
  }).filter(entry => entry.title && entry.url);
}

function fetchHtmlEntries_(source) {
  const response = UrlFetchApp.fetch(source.url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CatppuccinStartpageUpdateCenter/1.0)" }
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error("Page returned HTTP " + response.getResponseCode());
  }
  const html = response.getContentText();
  const anchorPattern = /<a\b([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  const results = [];
  let match;
  while ((match = anchorPattern.exec(html)) && results.length < 30) {
    const href = match[2];
    const url = resolveUrl_(source.url, href);
    if (!url) continue;
    const parsed = new URL(url);
    const base = new URL(source.url);
    if (parsed.hostname !== base.hostname) continue;
    if (source.pathPrefix && !parsed.pathname.startsWith(source.pathPrefix)) continue;
    const title = cleanText_(match[4]).slice(0, 240);
    if (title.length < 8 || /^(read more|learn more|view all|sign in)$/i.test(title)) continue;
    results.push({ title, url, summary: "", publishedAt: "" });
  }
  return results;
}

function addSource_(input) {
  const name = cleanText_(input.name).slice(0, 80);
  const category = cleanCategory_(input.category);
  const type = input.type === "html" ? "html" : "rss";
  const url = validatePublicHttpsUrl_(input.url);
  const pathPrefix = String(input.pathPrefix || "").trim().slice(0, 160);
  if (!name || !category || !url) throw new Error("Enter a source name, category, and valid HTTPS URL.");
  if (type === "html" && !pathPrefix.startsWith("/")) throw new Error("HTML sources need a path prefix beginning with / so navigation links are not collected.");
  const sources = readSources_();
  if (sources.some(source => source.url === url)) throw new Error("That source URL is already registered.");
  const id = digest_(url + "|" + Date.now()).slice(0, 24);
  const sheet = getSpreadsheet_().getSheetByName("Sources");
  sheet.appendRow([id, name, category, type, url, true, pathPrefix, "", "", ""]);
  return { ok: true, sources: readSources_() };
}

function toggleSource_(id, enabled) {
  const sheet = getSpreadsheet_().getSheetByName("Sources");
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, SOURCE_HEADERS.length).getValues() : [];
  const index = rows.findIndex(row => String(row[0]) === String(id));
  if (index < 0) throw new Error("Source not found.");
  rows[index][5] = enabled;
  sheet.getRange(index + 2, 1, 1, SOURCE_HEADERS.length).setValues([rows[index]]);
  return { ok: true, sources: readSources_() };
}

function removeSource_(id) {
  const sheet = getSpreadsheet_().getSheetByName("Sources");
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, SOURCE_HEADERS.length).getValues() : [];
  const index = rows.findIndex(row => String(row[0]) === String(id));
  if (index < 0) throw new Error("Source not found.");
  sheet.deleteRow(index + 2);
  return { ok: true, sources: readSources_() };
}

function getFeed_() {
  const sheet = getSpreadsheet_().getSheetByName("Updates");
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, UPDATE_HEADERS.length).getValues() : [];
  const updates = rows.slice(-100).reverse().map(row => ({
    id: String(row[0]), sourceId: String(row[1]), source: String(row[2]),
    category: String(row[3]), title: String(row[4]), url: String(row[5]),
    summary: String(row[6] || ""), publishedAt: String(row[7] || ""),
    discoveredAt: String(row[8] || "")
  }));
  return { ok: true, updates, sources: readSources_(), lastRun: getLastRun_(), frequency: PropertiesService.getScriptProperties().getProperty("UPDATE_CENTER_FREQUENCY") || "6h" };
}

function readSources_() {
  const sheet = getSpreadsheet_().getSheetByName("Sources");
  if (sheet.getLastRow() <= 1) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, SOURCE_HEADERS.length).getValues().map(row => ({
    id: String(row[0]), name: String(row[1]), category: String(row[2]),
    type: String(row[3]), url: String(row[4]), enabled: row[5] === true,
    pathPrefix: String(row[6] || ""), keywords: String(row[7] || ""),
    lastChecked: String(row[8] || ""), lastError: String(row[9] || "")
  }));
}

function ensureSheet_(spreadsheet, name, headers, seedRows) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (seedRows.length) sheet.getRange(2, 1, seedRows.length, headers.length).setValues(seedRows);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(UPDATE_SHEET_KEY);
  if (!id) throw new Error("Run setupUpdateCenter() in the Apps Script editor first.");
  return SpreadsheetApp.openById(id);
}

function authorize_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty(UPDATE_API_KEY);
  if (!expected || !provided || String(provided) !== expected) throw new Error("Unauthorized. Check the update-center API key.");
}

function validatePublicHttpsUrl_(value) {
  let url;
  try { url = new URL(String(value || "").trim()); } catch (error) { return ""; }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || !host || host === "localhost"
      || host.endsWith(".local") || /^127\./.test(host) || /^10\./.test(host)
      || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return "";
  return url.toString();
}

function resolveUrl_(base, href) {
  try {
    const url = new URL(String(href || ""), base);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.toString();
  } catch (error) { return ""; }
}

function normalizeUrl_(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch (error) { return ""; }
}

function cleanText_(value) {
  return String(value || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ").trim();
}

function cleanCategory_(value) {
  const category = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
  return category || "";
}

function parseDate_(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function childNodes_(node, names) {
  return node.getChildren().filter(child => names.includes(child.getName()));
}

function childText_(node, names) {
  const child = childNodes_(node, names)[0];
  return child ? child.getText() : "";
}

function descendantsNamed_(node, name) {
  let result = [];
  node.getChildren().forEach(child => {
    if (child.getName() === name) result.push(child);
    result = result.concat(descendantsNamed_(child, name));
  });
  return result;
}

function digest_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value))
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0")).join("");
}

function trimUpdates_(sheet, maximum) {
  const count = sheet.getLastRow() - 1;
  if (count > maximum) sheet.deleteRows(2, count - maximum);
}

function getLastRun_() {
  return PropertiesService.getScriptProperties().getProperty("UPDATE_CENTER_LAST_RUN") || "";
}

function safeError_(error) {
  return String(error && error.message || error || "Unknown error").slice(0, 300);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
