// Shows the nearest unsubmitted Schoology assignment and today's outstanding count
class SchoologyAssignments extends Component {
  static storageKey = "schoologyApiCredentials";

  constructor() {
    super();
    this.onclick = () => this.refresh();
    this.oncontextmenu = (event) => {
      event.preventDefault();
      this.configureCredentials();
    };
  }

  imports() {
    return [this.getResource("icons", "material"), this.getResource("fonts", "roboto")];
  }

  style() {
    return `
      .schoology-widget {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 100%;
        color: ${CONFIG.palette.text};
        font: 300 9pt 'Roboto', sans-serif;
        white-space: nowrap;
      }
      .schoology-icon { color: ${CONFIG.palette.blue}; font-size: 14pt; }
      .schoology-count { color: ${CONFIG.palette.peach}; font-weight: 700; }
      .schoology-message { overflow: hidden; text-overflow: ellipsis; max-width: 260px; }
      .settings-backdrop {
        position: fixed; inset: 0; z-index: 20; display: grid; place-items: center;
        background: rgb(0 0 0 / 55%); white-space: normal;
      }
      .settings-backdrop[hidden] { display: none; }
      .settings {
        width: min(360px, calc(100vw - 32px)); padding: 20px; box-sizing: border-box;
        border-radius: 12px; background: ${CONFIG.palette.mantle}; color: ${CONFIG.palette.text};
        box-shadow: 0 12px 40px rgb(0 0 0 / 35%); font: 400 14px 'Roboto', sans-serif;
      }
      .settings h2 { margin: 0 0 8px; font-size: 18px; }
      .settings p { line-height: 1.45; color: ${CONFIG.palette.subtext0}; }
      .settings label { display: block; margin: 12px 0 5px; }
      .settings input {
        width: 100%; box-sizing: border-box; padding: 9px; border: 1px solid ${CONFIG.palette.surface1};
        border-radius: 6px; background: ${CONFIG.palette.base}; color: ${CONFIG.palette.text};
      }
      .settings-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
      .settings button {
        border: 0; border-radius: 6px; padding: 8px 12px; cursor: pointer;
        background: ${CONFIG.palette.surface1}; color: ${CONFIG.palette.text};
      }
      .settings button[type="submit"] { background: ${CONFIG.palette.blue}; color: ${CONFIG.palette.base}; }
    `;
  }

  template() {
    return `<span class="schoology-widget" title="Click to refresh · Right-click to configure">
      <i class="material-icons schoology-icon">assignment</i>
      <span class="schoology-message">Schoology: right-click to set up</span>
    </span>
    <div class="settings-backdrop" hidden>
      <form class="settings">
        <h2>Connect Schoology</h2>
        <p>Credentials are saved in this browser only. They are not added to the repository.</p>
        <label for="schoology-consumer-key">Consumer key</label>
        <input id="schoology-consumer-key" autocomplete="off" spellcheck="false" required />
        <label for="schoology-consumer-secret">Consumer secret</label>
        <input id="schoology-consumer-secret" type="password" autocomplete="new-password" required />
        <div class="settings-actions">
          <button type="button" class="remove-credentials">Remove</button>
          <button type="button" class="cancel-settings">Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>`;
  }

  connectedCallback() {
    this.render().then(() => {
      this.shadow.querySelector(".settings-backdrop").addEventListener("click", (event) => {
        if (event.target.classList.contains("settings-backdrop")) this.closeSettings();
      });
      this.shadow.querySelector(".settings").addEventListener("submit", (event) => {
        event.preventDefault();
        const consumerKey = this.shadow.querySelector("#schoology-consumer-key").value.trim();
        const consumerSecret = this.shadow.querySelector("#schoology-consumer-secret").value.trim();
        localStorage.setItem(SchoologyAssignments.storageKey, JSON.stringify({ consumerKey, consumerSecret }));
        this.closeSettings();
        this.refresh();
      });
      this.shadow.querySelector(".cancel-settings").onclick = () => this.closeSettings();
      this.shadow.querySelector(".remove-credentials").onclick = () => {
        localStorage.removeItem(SchoologyAssignments.storageKey);
        this.closeSettings();
        this.setMessage("Credentials removed · right-click to connect");
      };
      if (this.getCredentials()) this.refresh();
    });
  }

  getCredentials() {
    try {
      return JSON.parse(localStorage.getItem(SchoologyAssignments.storageKey) || "null");
    } catch {
      return null;
    }
  }

  setMessage(message, count = null) {
    const target = this.shadow.querySelector(".schoology-message");
    if (!target) return;
    target.replaceChildren(document.createTextNode(message));
    if (count !== null) {
      const badge = document.createElement("span");
      badge.className = "schoology-count";
      badge.textContent = String(count);
      target.append(" ", badge, " due today");
    }
  }

  configureCredentials() {
    const current = this.getCredentials() || {};
    this.shadow.querySelector("#schoology-consumer-key").value = current.consumerKey || "";
    this.shadow.querySelector("#schoology-consumer-secret").value = current.consumerSecret || "";
    this.shadow.querySelector(".settings-backdrop").hidden = false;
    this.shadow.querySelector("#schoology-consumer-key").focus();
  }

  closeSettings() {
    this.shadow.querySelector(".settings-backdrop").hidden = true;
  }

  async signedGet(path, credentials) {
    const nonce = crypto.randomUUID().replaceAll("-", "");
    const params = {
      oauth_consumer_key: credentials.consumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: "PLAINTEXT",
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: "",
      oauth_version: "1.0",
      oauth_signature: `${credentials.consumerSecret}&`,
    };
    const header = Object.entries(params)
      .map(([name, value]) => `${encodeURIComponent(name)}="${encodeURIComponent(value)}"`)
      .join(", ");

    const response = await fetch(`https://api.schoology.com/v1/${path}`, {
      headers: { Authorization: `OAuth realm="Schoology API", ${header}`, Accept: "application/json" },
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Schoology rejected these credentials or this API access.");
      }
      throw new Error(`Schoology returned HTTP ${response.status}.`);
    }
    return response.json();
  }

  async list(path, collectionName, credentials) {
    const results = [];
    for (let start = 0; start < 2000; start += 200) {
      const separator = path.includes("?") ? "&" : "?";
      const data = await this.signedGet(`${path}${separator}start=${start}&limit=200`, credentials);
      const items = data[collectionName];
      const page = Array.isArray(items) ? items : items ? [items] : [];
      results.push(...page);
      const total = Number(data.total || data.total_items || 0);
      if (page.length < 200 || (total && results.length >= total)) break;
    }
    return results;
  }

  parseDue(value) {
    if (!value) return null;
    const parsed = new Date(String(value).replace(" ", "T"));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  async refresh() {
    const credentials = this.getCredentials();
    if (!credentials?.consumerKey || !credentials?.consumerSecret) {
      this.setMessage("Right-click to connect Schoology");
      return;
    }
    this.setMessage("Loading assignments…");

    try {
      const me = await this.signedGet("users/me", credentials);
      const userId = me.uid || me.id;
      if (!userId) throw new Error("Could not identify the Schoology user.");
      const sections = await this.list(`users/${encodeURIComponent(userId)}/sections`, "section", credentials);
      const sectionAssignments = await Promise.all(sections.map(async (section) => {
        const sectionId = section.id || section.section_id;
        if (!sectionId) return [];
        const assignments = await this.list(`sections/${encodeURIComponent(sectionId)}/assignments`, "assignment", credentials);
        return assignments.map((assignment) => ({
          ...assignment,
          sectionId,
          courseName: section.course_title || section.title || section.course?.title || "Class",
        }));
      }));
      const assignments = sectionAssignments.flat().filter((assignment) => this.parseDue(assignment.due));
      let nextIndex = 0;
      const outstanding = [];
      const worker = async () => {
        while (nextIndex < assignments.length) {
          const assignment = assignments[nextIndex++];
          const data = await this.signedGet(
            `sections/${encodeURIComponent(assignment.sectionId)}/submissions/${encodeURIComponent(assignment.id)}/${encodeURIComponent(userId)}`,
            credentials,
          );
          const revisions = data.revision || data.revisions || data.submission || [];
          const entries = Array.isArray(revisions) ? revisions : [revisions];
          const submitted = entries.some((revision) => revision && Number(revision.draft || 0) !== 1);
          if (!submitted) outstanding.push({ ...assignment, dueDate: this.parseDue(assignment.due) });
        }
      };
      await Promise.all(Array.from({ length: Math.min(4, assignments.length) }, worker));

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const dueToday = outstanding.filter(({ dueDate }) => dueDate >= todayStart && dueDate < tomorrowStart);
      const next = outstanding.filter(({ dueDate }) => dueDate >= now).sort((a, b) => a.dueDate - b.dueDate)[0];

      const dueCount = dueToday.length;
      if (!next) {
        this.setMessage(dueCount ? "No future deadlines ·" : "All caught up ·", dueCount);
        return;
      }
      const dueLabel = next.dueDate.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
      this.setMessage(`${next.title || "Assignment"} · ${next.courseName} · ${dueLabel} ·`, dueCount);
    } catch (error) {
      console.error("Schoology widget:", error);
      const message = error instanceof TypeError
        ? "Schoology connection blocked · right-click to retry"
        : `${error.message} · right-click to configure`;
      this.setMessage(message);
    }
  }
}
