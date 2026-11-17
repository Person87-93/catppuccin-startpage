const CUSTOM_LINKS_STORAGE_KEY = "customStartpageLinks";

const QUICK_LINK_ICONS = [
  "link", "world", "home", "search", "mail", "brand-gmail", "brand-google",
  "brand-github", "brand-youtube", "brand-discord", "brand-spotify", "brand-apple",
  "brand-steam", "brand-xbox", "calendar-event", "book", "school", "device-laptop",
  "code", "music", "video", "shopping-bag", "camera", "message-circle",
];

function getCustomLinks() {
  try {
    const links = JSON.parse(localStorage.getItem(CUSTOM_LINKS_STORAGE_KEY) || "[]");
    return Array.isArray(links) ? links : [];
  } catch {
    return [];
  }
}

function getStartpageTabs() {
  const tabs = JSON.parse(JSON.stringify(CONFIG.tabs));

  getCustomLinks().forEach((entry) => {
    const tab = tabs.find(({ name }) => name === entry.tabName);
    if (!tab || !entry.link) return;

    let category = tab.categories.find(({ name }) => name === entry.categoryName);
    if (!category) {
      category = { name: entry.categoryName || "Quick links", links: [] };
      tab.categories.push(category);
    }

    category.links.push(entry.link);
  });

  return tabs;
}

class ShortcutTools extends Component {
  refs = {
    overlay: "#shortcut-overlay",
    panels: ".shortcut-panel",
    paletteInput: "#palette-input",
    paletteResults: "#palette-results",
    linkForm: "#link-form",
    tabSelect: "#link-tab",
    categorySelect: "#link-category",
    linkRows: "#link-rows",
    savedLinks: "#saved-links",
  };

  activePanel = null;
  paletteItems = [];
  selectedPaletteIndex = 0;

  imports() {
    return [this.getResource("fonts", "roboto"), this.getResource("icons", "tabler")];
  }

  style() {
    return `
      :host {
        position: fixed;
        inset: 0;
        z-index: 10000;
        pointer-events: none;
        color: ${CONFIG.palette.text};
        font-family: 'Roboto', sans-serif;
      }

      #shortcut-overlay,
      #shortcut-overlay[hidden] {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: ${CONFIG.palette.crust}bb;
        backdrop-filter: blur(6px);
        pointer-events: auto;
      }

      #shortcut-overlay[hidden], .shortcut-panel[hidden] { display: none; }

      .shortcut-panel {
        width: min(680px, 100%);
        max-height: min(80vh, 760px);
        overflow: auto;
        padding: 26px;
        background: ${CONFIG.palette.base};
        border: 1px solid ${CONFIG.palette.surface1};
        border-radius: 12px;
        box-shadow: 0 18px 60px #0008;
      }

      .shortcut-panel h2 { margin: 0 0 18px; font-size: 20px; }
      .shortcut-panel h3 { margin: 24px 0 10px; font-size: 14px; }
      .shortcut-panel p { color: ${CONFIG.palette.subtext1}; line-height: 1.5; }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      button, input, select {
        font: inherit;
      }

      button {
        border: 0;
        border-radius: 6px;
        padding: 9px 13px;
        color: ${CONFIG.palette.text};
        background: ${CONFIG.palette.surface0};
        cursor: pointer;
      }

      button:hover { background: ${CONFIG.palette.surface1}; }
      button.primary { background: ${CONFIG.palette.blue}; color: ${CONFIG.palette.crust}; font-weight: 700; }
      button.remove { padding: 7px 10px; color: ${CONFIG.palette.red}; }
      .close { font-size: 20px; padding: 4px 10px; }

      kbd {
        min-width: 38px;
        padding: 5px 9px;
        border-radius: 5px;
        color: ${CONFIG.palette.lavender};
        background: ${CONFIG.palette.mantle};
        text-align: center;
        font: 600 13px monospace;
      }

      .shortcut-list { display: grid; grid-template-columns: auto 1fr; gap: 12px 16px; align-items: center; }
      .palette-search { width: 100%; box-sizing: border-box; margin: 0 0 14px; padding: 13px 14px; font-size: 17px; }
      input, select {
        min-width: 0;
        box-sizing: border-box;
        padding: 10px;
        border: 1px solid ${CONFIG.palette.surface1};
        border-radius: 6px;
        color: ${CONFIG.palette.text};
        background: ${CONFIG.palette.mantle};
      }

      input:focus, select:focus, button:focus-visible { outline: 2px solid ${CONFIG.palette.blue}; outline-offset: 2px; }
      .palette-results, .saved-links { display: grid; gap: 6px; max-height: 48vh; overflow: auto; }
      .palette-result, .saved-link {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        box-sizing: border-box;
        padding: 11px 13px;
        text-align: left;
      }

      .palette-result.selected { background: ${CONFIG.palette.surface1}; }
      .palette-result i, .link-row-preview { color: ${CONFIG.palette.green}; font-size: 20px; }
      .palette-result span, .saved-link-name { flex: 1; }
      .palette-result small, .saved-link small { display: block; margin-top: 3px; color: ${CONFIG.palette.subtext0}; font-size: 11px; }
      .empty-results { padding: 12px; color: ${CONFIG.palette.subtext1}; }

      .editor-field { display: grid; gap: 6px; margin: 14px 0; color: ${CONFIG.palette.subtext1}; font-size: 13px; }
      .link-rows { display: grid; gap: 12px; }
      .link-row {
        display: grid;
        grid-template-columns: minmax(100px, 1fr) minmax(160px, 1.5fr) minmax(150px, .9fr) 36px;
        gap: 8px;
        align-items: center;
        padding: 12px;
        background: ${CONFIG.palette.mantle};
        border-radius: 8px;
      }

      .link-row input { width: 100%; }
      .icon-picker { position: relative; min-width: 0; }
      .icon-picker-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-width: 0;
        overflow: hidden;
        text-align: left;
      }
      .icon-picker-toggle i { color: ${CONFIG.palette.blue}; font-size: 19px; }
      .icon-picker-toggle .icon-picker-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .icon-picker-options {
        position: absolute;
        z-index: 2;
        top: calc(100% + 6px);
        right: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(120px, 1fr));
        gap: 4px;
        width: min(330px, 75vw);
        max-height: 260px;
        overflow: auto;
        padding: 8px;
        border: 1px solid ${CONFIG.palette.surface1};
        border-radius: 8px;
        background: ${CONFIG.palette.base};
        box-shadow: 0 10px 30px #0008;
      }
      .icon-picker-options[hidden] { display: none; }
      .icon-option { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 8px; text-align: left; font-size: 12px; }
      .icon-option i { color: ${CONFIG.palette.blue}; font-size: 18px; }
      .icon-option[aria-selected="true"] { background: ${CONFIG.palette.surface1}; }
      .editor-actions { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; margin-top: 14px; }
      .saved-link { justify-content: space-between; }

      @media (max-width: 650px) {
        .shortcut-panel { padding: 18px; }
        .link-row { grid-template-columns: minmax(0, 1fr) 36px; }
        .link-row .link-name-input, .link-row .link-url-input, .link-row .icon-picker { grid-column: 1; }
        .link-row .remove-row { grid-column: 2; grid-row: 1; }
      }
    `;
  }

  template() {
    return `
      <div id="shortcut-overlay" hidden>
        <section class="shortcut-panel" data-panel="shortcuts-help" role="dialog" aria-modal="true" aria-labelledby="help-title" hidden>
          <div class="panel-header"><h2 id="help-title">Keyboard shortcuts</h2><button class="close" data-close aria-label="Close">×</button></div>
          <div class="shortcut-list">
            <kbd>s</kbd><span>Open search</span>
            <kbd>/</kbd><span>Search your saved links</span>
            <kbd>?</kbd><span>Show this shortcut guide</span>
            <kbd>b</kbd><span>Add or remove quick links</span>
            <kbd>g</kbd><span>Open Gmail</span>
            <kbd>m</kbd><span>Open Apple Music</span>
            <kbd>y</kbd><span>Open YouTube</span>
            <kbd>1–3</kbd><span>Switch start-page tabs</span>
          </div>
          <p>Shortcuts work when you are not typing in a field.</p>
        </section>

        <section class="shortcut-panel" data-panel="command-palette" role="dialog" aria-modal="true" aria-labelledby="palette-title" hidden>
          <div class="panel-header"><h2 id="palette-title">Open a saved link</h2><button class="close" data-close aria-label="Close">×</button></div>
          <input id="palette-input" class="palette-search" type="search" placeholder="Type a name, category, or address…" autocomplete="off">
          <div id="palette-results" class="palette-results" role="listbox"></div>
        </section>

        <section class="shortcut-panel" data-panel="link-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title" hidden>
          <div class="panel-header"><h2 id="editor-title">Quick links</h2><button class="close" data-close aria-label="Close">×</button></div>
          <p>Add links to a tab and category. Your links and icon choices are saved in this browser.</p>
          <form id="link-form">
            <label class="editor-field">Tab<select id="link-tab" required></select></label>
            <label class="editor-field">Category<select id="link-category" required></select></label>
            <div id="link-rows" class="link-rows"></div>
            <div class="editor-actions">
              <button type="button" id="add-link-row">+ Add another link</button>
              <button type="submit" class="primary">Save links</button>
            </div>
          </form>
          <h3>Your added links</h3>
          <div id="saved-links" class="saved-links"></div>
        </section>
      </div>
    `;
  }

  connectedCallback() {
    this.render().then(() => {
      this.setEvents();
      this.populateTabs();
      this.addLinkRow();
      this.renderSavedLinks();
    });
  }

  setEvents() {
    this.refs.overlay.addEventListener("click", (event) => {
      if (!event.target.closest(".icon-picker")) {
        this.refs.linkRows.querySelectorAll(".icon-picker-options").forEach((menu) => { menu.hidden = true; });
      }
      if (event.target === this.refs.overlay || event.target.closest("[data-close]")) this.close();
    });

    this.refs.overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        const openMenu = this.refs.linkRows.querySelector(".icon-picker-options:not([hidden])");
        if (openMenu) {
          openMenu.hidden = true;
          openMenu.previousElementSibling.focus();
          return;
        }
        this.close();
      }
    });

    this.refs.paletteInput.addEventListener("input", () => this.renderPaletteResults());
    this.refs.paletteInput.addEventListener("keydown", (event) => this.handlePaletteKey(event));
    this.refs.tabSelect.addEventListener("change", () => this.populateCategories());
    this.refs.linkForm.addEventListener("submit", (event) => this.saveLinks(event));
    this.shadow.querySelector("#add-link-row").addEventListener("click", () => this.addLinkRow());
    this.refs.linkRows.addEventListener("click", (event) => {
      const toggle = event.target.closest(".icon-picker-toggle");
      if (toggle) {
        const menu = toggle.nextElementSibling;
        const shouldOpen = menu.hidden;
        this.refs.linkRows.querySelectorAll(".icon-picker-options").forEach((item) => { item.hidden = true; });
        menu.hidden = !shouldOpen;
        return;
      }

      const option = event.target.closest(".icon-option");
      if (option) {
        this.selectIcon(option);
        return;
      }

      if (event.target.closest(".remove-row")) {
        const rows = this.refs.linkRows.querySelectorAll(".link-row");
        if (rows.length > 1) event.target.closest(".link-row").remove();
      }
    });
    this.refs.savedLinks.addEventListener("click", (event) => {
      const button = event.target.closest("[data-remove-index]");
      if (button) this.removeSavedLink(Number(button.dataset.removeIndex));
    });
  }

  open(action) {
    const panelName = action === "shortcuts-help" ? action
      : action === "command-palette" ? action
        : action === "link-editor" ? action : null;
    if (!panelName) return;

    this.activePanel = panelName;
    this.refs.overlay.hidden = false;
    this.refs.panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== panelName; });

    if (panelName === "command-palette") {
      this.refs.paletteInput.value = "";
      this.renderPaletteResults();
      this.refs.paletteInput.focus();
    } else if (panelName === "link-editor") {
      this.populateTabs();
      this.renderSavedLinks();
      this.refs.tabSelect.focus();
    } else {
      this.shadow.querySelector('[data-panel="shortcuts-help"] [data-close]').focus();
    }
  }

  close() {
    this.refs.overlay.hidden = true;
    this.activePanel = null;
  }

  getLinks() {
    return getStartpageTabs().flatMap((tab) => tab.categories.flatMap((category) =>
      category.links.map((link) => ({
        ...link,
        tabName: tab.name,
        categoryName: category.name,
      })),
    ));
  }

  renderPaletteResults() {
    const query = this.refs.paletteInput.value.trim().toLowerCase();
    const links = this.getLinks().filter((link) =>
      `${link.name} ${link.url} ${link.tabName} ${link.categoryName}`.toLowerCase().includes(query),
    ).slice(0, 40);

    this.paletteItems = links;
    this.selectedPaletteIndex = 0;
    this.refs.paletteResults.replaceChildren();

    if (!links.length) {
      const empty = document.createElement("div");
      empty.className = "empty-results";
      empty.textContent = "No matching links";
      this.refs.paletteResults.append(empty);
      return;
    }

    links.forEach((link, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `palette-result${index === 0 ? " selected" : ""}`;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", index === 0 ? "true" : "false");

      const icon = document.createElement("i");
      icon.className = `ti ti-${/^[a-z0-9-]+$/i.test(link.icon || "") ? link.icon : "link"}`;
      if (link.icon_color) icon.style.color = link.icon_color;

      const label = document.createElement("span");
      label.textContent = link.name || link.url;
      const metadata = document.createElement("small");
      metadata.textContent = `${link.categoryName} · ${link.tabName}`;
      label.append(metadata);
      button.append(icon, label);
      button.addEventListener("click", () => this.openLink(link.url));
      this.refs.paletteResults.append(button);
    });
  }

  handlePaletteKey(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!this.paletteItems.length) return;
      const direction = event.key === "ArrowDown" ? 1 : -1;
      this.selectedPaletteIndex = (this.selectedPaletteIndex + direction + this.paletteItems.length) % this.paletteItems.length;
      this.refs.paletteResults.querySelectorAll(".palette-result").forEach((button, index) => {
        const selected = index === this.selectedPaletteIndex;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-selected", String(selected));
      });
      this.refs.paletteResults.querySelector(".selected")?.scrollIntoView({ block: "nearest" });
      return;
    }

    if (event.key === "Enter" && this.paletteItems.length) {
      event.preventDefault();
      this.openLink(this.paletteItems[this.selectedPaletteIndex].url);
    }
  }

  openLink(url) {
    if (!/^https?:\/\//i.test(url || "")) return;
    window.open(url, "_blank", "noopener,noreferrer");
    this.close();
  }

  populateTabs() {
    const tabs = getStartpageTabs();
    this.refs.tabSelect.replaceChildren();
    tabs.forEach((tab, index) => this.refs.tabSelect.add(new Option(tab.name, String(index))));
    this.populateCategories();
  }

  populateCategories() {
    const tab = getStartpageTabs()[Number(this.refs.tabSelect.value)] || getStartpageTabs()[0];
    this.refs.categorySelect.replaceChildren();
    (tab?.categories || []).forEach((category, index) =>
      this.refs.categorySelect.add(new Option(category.name, String(index))),
    );
  }

  addLinkRow() {
    const row = document.createElement("div");
    row.className = "link-row";

    const name = document.createElement("input");
    name.type = "text";
    name.className = "link-name-input";
    name.placeholder = "Link name";
    name.setAttribute("aria-label", "Link name");

    const url = document.createElement("input");
    url.type = "text";
    url.inputMode = "url";
    url.className = "link-url-input";
    url.placeholder = "https://example.com";
    url.setAttribute("aria-label", "Link address");

    const iconInput = document.createElement("input");
    iconInput.type = "hidden";
    iconInput.className = "link-icon-select";

    const picker = document.createElement("div");
    picker.className = "icon-picker";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "icon-picker-toggle";
    toggle.setAttribute("aria-label", "Choose an icon");
    toggle.setAttribute("aria-haspopup", "listbox");
    const preview = document.createElement("i");
    preview.className = "ti ti-link";
    preview.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "icon-picker-label";
    label.textContent = "Choose an icon";
    toggle.append(preview, label);

    const options = document.createElement("div");
    options.className = "icon-picker-options";
    options.hidden = true;
    options.setAttribute("role", "listbox");
    options.setAttribute("aria-label", "Available icons");
    [{ name: "No icon", value: "" }, ...QUICK_LINK_ICONS.map((name) => ({ name, value: name }))]
      .forEach(({ name, value }) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "icon-option";
        option.dataset.icon = value;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", "false");

        const icon = document.createElement("i");
        icon.className = `ti ti-${value || "ban"}`;
        icon.setAttribute("aria-hidden", "true");
        const optionLabel = document.createElement("span");
        optionLabel.textContent = name;
        option.append(icon, optionLabel);
        options.append(option);
      });

    picker.append(toggle, options);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove remove-row";
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Remove link row");

    row.append(name, url, iconInput, picker, remove);
    this.refs.linkRows.append(row);
    name.focus();
  }

  selectIcon(option) {
    const row = option.closest(".link-row");
    const value = option.dataset.icon;
    row.querySelector(".link-icon-select").value = value;

    const toggle = row.querySelector(".icon-picker-toggle");
    toggle.querySelector("i").className = `ti ti-${value || "ban"}`;
    toggle.querySelector(".icon-picker-label").textContent = value || "No icon";
    toggle.setAttribute("aria-label", value ? `Selected icon: ${value}` : "No icon selected");
    row.querySelectorAll(".icon-option").forEach((item) =>
      item.setAttribute("aria-selected", String(item === option)),
    );
    row.querySelector(".icon-picker-options").hidden = true;
    toggle.focus();
  }

  saveLinks(event) {
    event.preventDefault();
    const tabs = getStartpageTabs();
    const tab = tabs[Number(this.refs.tabSelect.value)];
    const category = tab?.categories[Number(this.refs.categorySelect.value)];
    if (!tab || !category) return;

    const rows = [...this.refs.linkRows.querySelectorAll(".link-row")];
    const newLinks = [];

    for (const row of rows) {
      const name = row.querySelector(".link-name-input").value.trim();
      const rawUrl = row.querySelector(".link-url-input").value.trim();
      const icon = row.querySelector(".link-icon-select").value;
      if (!name && !rawUrl) continue;
      if (!name || !rawUrl) {
        alert("Enter both a link name and address, or leave the row empty.");
        return;
      }

      let url;
      try {
        url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
      } catch {
        alert(`That address does not look valid: ${rawUrl}`);
        return;
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        alert("Quick links must use an HTTP or HTTPS address.");
        return;
      }

      newLinks.push({
        tabName: tab.name,
        categoryName: category.name,
        link: {
          name,
          url: url.href,
          ...(icon ? { icon, icon_color: CONFIG.palette.blue } : {}),
        },
      });
    }

    if (!newLinks.length) return;
    localStorage.setItem(CUSTOM_LINKS_STORAGE_KEY, JSON.stringify([...getCustomLinks(), ...newLinks]));
    window.location.reload();
  }

  renderSavedLinks() {
    this.refs.savedLinks.replaceChildren();
    const links = getCustomLinks();
    if (!links.length) {
      const empty = document.createElement("p");
      empty.textContent = "No added links yet.";
      this.refs.savedLinks.append(empty);
      return;
    }

    links.forEach(({ tabName, categoryName, link }, index) => {
      const item = document.createElement("div");
      item.className = "saved-link";
      const label = document.createElement("span");
      label.className = "saved-link-name";
      label.textContent = link.name;
      const details = document.createElement("small");
      details.textContent = `${categoryName} · ${tabName}`;
      label.append(details);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = "Remove";
      remove.dataset.removeIndex = String(index);
      item.append(label, remove);
      this.refs.savedLinks.append(item);
    });
  }

  removeSavedLink(index) {
    const links = getCustomLinks();
    if (index < 0 || index >= links.length) return;
    links.splice(index, 1);
    localStorage.setItem(CUSTOM_LINKS_STORAGE_KEY, JSON.stringify(links));
    window.location.reload();
  }
}
