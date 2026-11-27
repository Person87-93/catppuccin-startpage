
class DailyDigest extends Component {
  static cacheKey = "startpageDailyDigestCache";
  imports() { return [this.getResource("icons", "tabler"), this.getResource("fonts", "roboto")]; }
  style() {
    return [
      ":host { position:fixed; z-index:99999; top:18px; right:18px; color:" + CONFIG.palette.text + "; font-family:Roboto,sans-serif; }",
      "button { font:inherit; cursor:pointer; color:inherit; }",
      ".toggle { display:inline-flex; align-items:center; gap:8px; padding:9px 13px; border:1px solid " + CONFIG.palette.surface1 + "; border-radius:999px; background:" + CONFIG.palette.base + "e8; box-shadow:0 5px 18px #0003; backdrop-filter:blur(14px); }",
      ".toggle i { color:" + CONFIG.palette.blue + "; font-size:16px; }",
      ".panel { position:absolute; top:46px; right:0; width:min(370px,calc(100vw - 28px)); max-height:min(78vh,680px); overflow:auto; padding:16px; border:1px solid " + CONFIG.palette.surface1 + "; border-radius:12px; background:" + CONFIG.palette.base + "f5; box-shadow:0 18px 48px #0008; backdrop-filter:blur(18px); }",
      ".panel[hidden] { display:none; }",
      ".heading,.actions { display:flex; align-items:center; justify-content:space-between; gap:10px; }",
      "h2 { margin:0; font-size:17px; } h3 { margin:16px 0 7px; color:" + CONFIG.palette.subtext1 + "; font-size:11px; letter-spacing:.1em; text-transform:uppercase; }",
      "p { margin:7px 0; line-height:1.45; overflow-wrap:anywhere; }",
      ".date,.status { color:" + CONFIG.palette.subtext0 + "; font-size:11px; }",
      ".summary { padding:10px; border-radius:8px; background:" + CONFIG.palette.mantle + "; font-size:13px; }",
      ".priority { border-left:3px solid " + CONFIG.palette.peach + "; padding:8px 10px; background:" + CONFIG.palette.mantle + "; border-radius:5px; }",
      ".entry { padding:8px 0; border-bottom:1px solid " + CONFIG.palette.surface0 + "; font-size:12px; }",
      ".entry a { color:" + CONFIG.palette.blue + "; text-decoration:none; } .entry p { color:" + CONFIG.palette.subtext1 + "; font-size:11px; }",
      ".empty { color:" + CONFIG.palette.subtext0 + "; font-size:12px; }",
      ".actions button { border:0; border-radius:6px; padding:6px 9px; background:" + CONFIG.palette.surface0 + "; }",
      "@media (max-width:520px) { :host { top:10px; right:10px; } .panel { max-height:72vh; } }"
    ].join("\n");
  }
  template() {
    return '<button class="toggle" type="button" aria-expanded="false"><i class="ti ti-sparkles"></i><span>daily digest</span><span class="status" data-status>offline</span></button>' +
      '<section class="panel" hidden role="dialog" aria-label="Daily digest">' +
      '<div class="heading"><div><h2>your daily digest</h2><div class="date" data-date>waiting for data</div></div>' +
      '<div class="actions"><button type="button" data-refresh>refresh</button><button type="button" data-close aria-label="Close">×</button></div></div>' +
      '<div data-body><p class="empty">connect the browser extension and configure the Apps Script endpoint to load your digest.</p></div></section>';
  }
  connectedCallback() {
    this.render().then(() => {
      this.toggle = this.shadow.querySelector(".toggle");
      this.panel = this.shadow.querySelector(".panel");
      this.body = this.shadow.querySelector("[data-body]");
      this.status = this.shadow.querySelector("[data-status]");
      this.toggle.addEventListener("click", () => {
        const open = this.panel.hidden;
        this.panel.hidden = !open;
        this.toggle.setAttribute("aria-expanded", String(open));
        if (open) this.load();
      });
      this.shadow.querySelector("[data-close]").addEventListener("click", () => {
        this.panel.hidden = true;
        this.toggle.setAttribute("aria-expanded", "false");
      });
      this.refreshButton = this.shadow.querySelector("[data-refresh]");
      this.refreshButton.addEventListener("click", () => this.load(true));
      try {
        const cached = JSON.parse(localStorage.getItem(DailyDigest.cacheKey) || "null");
        if (cached) this.renderData(cached, "cached");
      } catch {}
    });
  }
  requestDigest(refresh = false) {
    return new Promise((resolve, reject) => {
      const requestId = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now());
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", listener);
        reject(new Error("Extension did not respond. Check that it is enabled on this startpage."));
      }, refresh ? 60000 : 12000);
      const listener = event => {
        const message = event.data;
        if (event.source !== window || event.origin !== location.origin || message?.type !== "startpage-digest-response" || message.requestId !== requestId) return;
        window.clearTimeout(timeout);
        window.removeEventListener("message", listener);
        if (!message.response || !message.response.ok) reject(new Error(message.response && message.response.error || "Digest endpoint returned an error."));
        else resolve(message.response);
      };
      window.addEventListener("message", listener);
      window.postMessage({ type: refresh ? "startpage-digest-refresh" : "startpage-digest-get", requestId }, location.origin);
    });
  }
  async load(refresh = false) {
    if (this.refreshButton) this.refreshButton.disabled = true;
    this.status.textContent = refresh ? "refreshing" : "loading";
    try {
      const data = await this.requestDigest(refresh);
      localStorage.setItem(DailyDigest.cacheKey, JSON.stringify(data));
      this.renderData(data, "live");
    } catch (error) {
      this.status.textContent = "cached";
      if (!this.body.children.length || this.body.querySelector(".empty")) {
        this.body.replaceChildren();
        const note = document.createElement("p");
        note.className = "empty";
        note.textContent = error.message + " Previously cached information remains available when present.";
        this.body.append(note);
      } else {
        const warning = document.createElement("p");
        warning.className = "status";
        warning.textContent = "refresh failed: " + error.message;
        this.body.append(warning);
      }
    } finally {
      if (this.refreshButton) this.refreshButton.disabled = false;
    }
  }
  renderData(data, mode) {
    const digest = data.digest || {};
    this.status.textContent = mode;
    this.shadow.querySelector("[data-date]").textContent = digest.date ? "updated " + digest.date : "no digest has been written yet";
    this.body.replaceChildren();
    if (digest.summary) this.addBlock("today", digest.summary, "summary");
    if (digest.topPriority) this.addBlock("top priority", digest.topPriority + (digest.priorityReason ? " · " + digest.priorityReason : ""), "priority");
    if (digest.nextEvent) this.addBlock("next event", digest.nextEvent, "summary");
    if (digest.projectHighlight) this.addBlock("project highlight", digest.projectHighlight, "summary");
    this.addList("tasks", data.tasks || [], item => item.title, item => [item.dueAt, item.priority, item.status].filter(Boolean).join(" · "));
    this.addList("upcoming", data.calendar || [], item => item.title, item => [item.startAt, item.location].filter(Boolean).join(" · "));
    this.addList("project updates", data.projects || [], item => item.project, item => item.update, item => item.url);
    this.addList("news", data.news || [], item => item.title, item => [item.source, item.summary].filter(Boolean).join(" · "), item => item.url);
    if (!this.body.children.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "the sheet is connected, but no digest content has been added yet.";
      this.body.append(empty);
    }
    const stamp = document.createElement("p");
    stamp.className = "status";
    stamp.textContent = "read from sheets · " + (data.servedAt ? new Date(data.servedAt).toLocaleTimeString() : mode);
    this.body.append(stamp);
  }
  addBlock(label, value, className) {
    const heading = document.createElement("h3"); heading.textContent = label;
    const block = document.createElement("p"); block.className = className; block.textContent = value;
    this.body.append(heading, block);
  }
  addList(label, items, titleFor, detailFor, urlFor = () => "") {
    if (!items.length) return;
    const heading = document.createElement("h3"); heading.textContent = label;
    const list = document.createElement("div");
    items.forEach(item => {
      const row = document.createElement("div"); row.className = "entry";
      const title = titleFor(item) || "untitled";
      const url = urlFor(item);
      if (url && (url.startsWith("https://") || url.startsWith("http://"))) {
        const link = document.createElement("a"); link.href = url; link.target = "_blank";
        link.rel = "noopener noreferrer"; link.textContent = title; row.append(link);
      } else {
        const strong = document.createElement("strong"); strong.textContent = title; row.append(strong);
      }
      const detail = detailFor(item);
      if (detail) { const text = document.createElement("p"); text.textContent = detail; row.append(text); }
      list.append(row);
    });
    this.body.append(heading, list);
  }
}
