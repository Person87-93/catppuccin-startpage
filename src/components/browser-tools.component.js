// Small startpage entry point for the companion extension's browser dashboard.
class BrowserTools extends Component {
  imports() {
    return [this.getResource("icons", "tabler"), this.getResource("fonts", "roboto")];
  }

  style() {
    return `
      :host { display: inline-flex; align-items: center; height: 100%; color: ${CONFIG.palette.text}; }
      button { display: inline-flex; align-items: center; gap: 6px; height: 100%; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; font: inherit; }
      button:hover { color: ${CONFIG.palette.lavender || CONFIG.palette.mauve}; }
      i { font-size: 17px; }
      .label { font-size: 12px; }
    `;
  }

  template() {
    return `<button type="button" aria-label="Open browser dashboard" title="Workspaces, focus mode, and diagnostics"><i class="ti ti-layout-dashboard"></i><span class="label">browser</span></button>`;
  }

  connectedCallback() {
    this.render().then(() => {
      this.shadow.querySelector("button").addEventListener("click", () => {
        window.postMessage({
          type: "browser-tools-open-dashboard",
          requestId: `dashboard-${Date.now()}`,
        }, location.origin);
      });
    });
  }
}
