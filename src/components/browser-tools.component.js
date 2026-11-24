// Small startpage entry point for the companion extension's browser dashboard.
class BrowserTools extends Component {
  imports() {
    return [this.getResource("icons", "tabler"), this.getResource("fonts", "roboto")];
  }

  style() {
    return `
      :host { display: inline-flex; align-items: center; height: 100%; color: ${CONFIG.palette.text}; }
      .tools { display: inline-flex; align-items: center; height: 100%; }
      button { display: inline-flex; align-items: center; gap: 5px; height: 100%; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; font: inherit; }
      button:hover { color: ${CONFIG.palette.lavender || CONFIG.palette.mauve}; }
      i { font-size: 17px; }
      .label { font-size: 12px; }
    `;
  }

  template() {
    return `<div class="tools"><button type="button" data-page="updates" aria-label="Open updates" title="News grouped by Fortnite, Google, Xbox, and more"><i class="ti ti-news"></i><span class="label">updates</span></button></div>`;
  }

  connectedCallback() {
    this.render().then(() => {
      this.shadow.querySelector('[data-page="updates"]').addEventListener("click", () => {
        window.postMessage({
          type: "browser-tools-open-updates",
          requestId: `updates-${Date.now()}`,
        }, location.origin);
      });
    });
  }
}
